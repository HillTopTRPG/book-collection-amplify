# AWS Amplify Gen 2 データ保護ガイド

## 概要

AWS Amplify Gen 2 でスキーマ変更を行う際のデータ保護方法についてまとめています。
`amplify/data/resource.ts` を変更してデプロイした際に、本番環境のデータを保護するための設定と注意点を記載しています。

## スキーマ変更の影響

### データが失われるケース

- **モデルの削除・リネーム**: `@model` を削除または名前変更すると、対応する DynamoDB テーブルが**完全削除**される
- **パーティションキー/ソートキーの変更**: テーブルの再作成が必要となり、すべてのデータが削除される

### データが保持されるケース

- **フィールドの追加**: DynamoDB はスキーマレスなので、新しいフィールドを追加してもデータは保持される
- **フィールドの削除**: 既存データは残るが、アプリケーションは新しいフィールドにアクセスする

## データ保護の実装方法

`amplify/backend.ts` で以下の設定を追加できます。

### 1. 削除保護（推奨）

CloudFormation スタック削除時でも DynamoDB テーブルが削除されないようにする設定です。

```typescript
import { RemovalPolicy } from "aws-cdk-lib";

// すべての DynamoDB テーブルに削除保護を適用
const { amplifyDynamoDbTables } = backend.data.resources.cfnResources;
for (const table of Object.values(amplifyDynamoDbTables)) {
  table.deletionProtectionEnabled = true;
}
```

### 2. スタック削除時の保持ポリシー

CloudFormation スタックを削除してもリソースを AWS アカウントに保持します。

```typescript
// 特定のテーブルに保持ポリシーを適用
backend.data.resources.cfnResources.amplifyDynamoDbTables["Todo"]
  .applyRemovalPolicy(RemovalPolicy.RETAIN);

// または、すべてのテーブルに適用
for (const table of Object.values(amplifyDynamoDbTables)) {
  table.applyRemovalPolicy(RemovalPolicy.RETAIN);
}
```

### 3. ポイントインタイムリカバリ（PITR: Point-in-Time Recovery）

過去35日間の任意の時点にテーブルを復元できるようにします。

```typescript
for (const table of Object.values(amplifyDynamoDbTables)) {
  table.pointInTimeRecoveryEnabled = true;
}
```

#### ポイントインタイムリカバリの詳細

**概要**

ポイントインタイムリカバリ（PITR）は、DynamoDB テーブルの継続的なバックアップ機能です。有効化すると、偶発的な書き込みや削除操作からテーブルデータを保護できます。

**主な特徴**

- **継続的バックアップ**: 秒単位の粒度で自動的に継続バックアップが作成される
- **復元可能期間**: 現在時刻の **5分前から35日前まで**の任意の時点に復元可能
- **自動化**: オンデマンドバックアップの作成、維持、スケジュールを管理する必要がない
- **復元期間の設定**: 1日から35日の間で復元期間を設定可能（デフォルトは35日）

**料金**

- DynamoDB テーブルのサイズ（テーブルデータ + ローカルセカンダリインデックス）に基づいて課金される
- 復元期間を変更しても料金は変わらない（35日でも1日でも同じコスト）
- 2018年時点で米国西部（北カリフォルニア）リージョンでは約 **$0.224 per GB-month**
- PITR を無効化するまで継続的に課金される
- 最新の料金は [AWS DynamoDB 料金ページ](https://aws.amazon.com/dynamodb/pricing/) で確認してください

**復元方法**

PITRによる復元は常に**新しいテーブル**として作成されます。既存テーブルへの上書きはできません。

**AWS CLI での復元例:**

```bash
# 最新の復元可能時点への復元
aws dynamodb restore-table-to-point-in-time \
  --source-table-name Music \
  --target-table-name MusicRestored \
  --use-latest-restorable-time

# 特定の時点への復元（UNIXタイムスタンプ指定）
aws dynamodb restore-table-to-point-in-time \
  --source-table-name Music \
  --target-table-name MusicRestored \
  --no-use-latest-restorable-time \
  --restore-date-time 1519257118.0
```

**AWS コンソールでの復元:**

1. DynamoDB コンソールで対象テーブルを選択
2. 「Backups」タブを開く
3. 「Point-in-time recovery (PITR)」セクションで「Restore」を選択
4. 復元日時を指定
5. 新しいテーブル名を入力して復元を実行

**元のテーブル名で復元する方法**

PITRは常に新しいテーブルとして復元されるため、元のテーブル名を使いたい場合は以下の手順が必要です：

1. 新しい名前でテーブルを復元（例: `Music-Restored`）
2. 元のテーブルを削除（例: `Music`）
3. 復元されたテーブルの名前を元の名前に変更、またはアプリケーション側で接続先を変更

または、復元したテーブルのデータを元のテーブルにスクリプトで移行する方法もあります。

**クロスリージョン復元**

別の AWS リージョンにテーブルを復元することも可能です：

```bash
# 別リージョンへの復元（--source-table-arn が必要）
aws dynamodb restore-table-to-point-in-time \
  --source-table-arn arn:aws:dynamodb:us-east-1:123456789012:table/Music \
  --target-table-name Music \
  --use-latest-restorable-time \
  --region us-west-2
```

**セカンダリインデックスの除外**

復元時にセカンダリインデックスを除外することで、復元を高速化しコストを削減できます。

**テーブル削除時の自動バックアップ**

PITR が有効なテーブルを削除すると、DynamoDB は自動的に「システムバックアップ」を作成し、35日間保持します（追加コストなし）。

**制限事項**

- 復元は常に新しいテーブルとして作成される（既存テーブルへの上書き不可）
- 最も古い復元可能時点は現在時刻の5分前まで
- 復元可能期間は最大35日間

**有効化方法（AWS CLI）**

```bash
# PITR を有効化（復元期間35日）
aws dynamodb update-continuous-backups \
  --table-name Music \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true,RecoveryPeriodInDays=35
```

**ユースケース**

- 本番環境でのデータ保護
- 人的ミスによるデータ削除・変更からの復旧
- アプリケーションのバグによるデータ破損からの復旧
- コンプライアンス要件を満たすためのバックアップ戦略

### 4. AWS Backup（長期バックアップ）

35日以上のバックアップが必要な場合に使用します。

```typescript
import { BackupVault, BackupPlan, BackupPlanRule } from "aws-cdk-lib/aws-backup";
import { Duration } from "aws-cdk-lib";
import { Schedule } from "aws-cdk-lib/aws-events";

const backupVault = new BackupVault(backupStack, "BackupVault", {
  backupVaultName: "backup-vault",
});

const plan = new BackupPlan(backupStack, "BackupPlan", {
  backupVaultName: "backup-plan",
  backupVault,
});

plan.addRule(new BackupPlanRule({
  deleteAfter: Duration.days(60),
  ruleName: "backup-plan-rule",
  scheduleExpression: Schedule.cron({
    minute: "0",
    hour: "0",
    day: "*",
    month: "*",
    year: "*",
  }),
}));

// DynamoDB テーブルを Backup Plan に追加
for (const table of Object.values(amplifyDynamoDbTables)) {
  plan.addSelection("BackupSelection", {
    resources: [BackupResource.fromDynamoDbTable(table)],
  });
}
```

## 重要な注意点

### サンドボックス環境の制限

⚠️ **`ampx sandbox delete` は RemovalPolicy を無視します**

サンドボックス環境では常にすべてのリソースが削除されるため、本番環境にのみ保護設定が有効です。

### 本番環境での推奨フロー

1. サンドボックス環境でスキーマ変更をテスト
2. 本番環境にデプロイ前に上記の保護設定を適用
3. スキーマ変更が既存データと互換性があるか確認
4. 本番環境へデプロイ

### DynamoDB テーブル名の構造

Amplify が生成する DynamoDB テーブル名は以下の形式です：

```
<model-name>-<aws-appsync-api-id>-<amplify-api-environment-name>
```

例: `Todo-123456-dev`（`123456` は AppSync API ID、`dev` は環境名）

## データを保持したまま構造を変更する方法

### 既存テーブルへの接続

完全に新しいスキーマが必要な場合、既存の DynamoDB テーブルに接続する方法があります。

```typescript
import { a } from '@aws-amplify/backend';

export const data = a.configure({
  name: 'myDataResource',
  authorization: [a.allow.public()],
})
.addToSchema(`
  type ExistingData @refersTo(name: "existing-table-name") {
    id: ID!
    # 既存のフィールド定義
  }
`)
```

### データ移行が必要な場合

大きな構造変更の場合は、Lambda 関数を使ったデータ移行スクリプトを作成し、旧テーブルから新テーブルへデータをコピーする必要があります。

```typescript
// Lambda 関数の例（疑似コード）
import { DynamoDBClient, ScanCommand, BatchWriteItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

async function migrateData() {
  // 旧テーブルからデータを取得
  const scanResult = await client.send(new ScanCommand({
    TableName: "OldTable-xxx-prod",
  }));

  // 新テーブルにデータを書き込み
  await client.send(new BatchWriteItemCommand({
    RequestItems: {
      "NewTable-xxx-prod": scanResult.Items.map(item => ({
        PutRequest: { Item: transformItem(item) }
      }))
    }
  }));
}
```

## ベストプラクティス

### 本番環境での必須設定

最低限、以下の設定を `amplify/backend.ts` に追加することを推奨します：

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { RemovalPolicy } from 'aws-cdk-lib';
import { auth } from './auth/resource';
import { data } from './data/resource';

const backend = defineBackend({
  auth,
  data,
});

// 本番環境保護設定
const { amplifyDynamoDbTables } = backend.data.resources.cfnResources;

for (const table of Object.values(amplifyDynamoDbTables)) {
  // 1. 削除保護を有効化
  table.deletionProtectionEnabled = true;

  // 2. スタック削除時も保持
  table.applyRemovalPolicy(RemovalPolicy.RETAIN);

  // 3. ポイントインタイムリカバリを有効化
  table.pointInTimeRecoveryEnabled = true;
}
```

### スキーマ変更のチェックリスト

- [ ] サンドボックス環境でスキーマ変更をテスト
- [ ] データ保護設定が `amplify/backend.ts` に記載されているか確認
- [ ] パーティションキー/ソートキーの変更がないか確認
- [ ] モデル名の変更がないか確認
- [ ] 新しいフィールドにデフォルト値や null 許容設定があるか確認
- [ ] 本番環境へのデプロイ前にバックアップを取得
- [ ] デプロイ後、データが正しく保持されているか確認

## 結論

**DBデータだけ残して他をリセットすることは可能**ですが、以下の対策が必要です：

1. `RemovalPolicy.RETAIN` を設定する
2. `deletionProtectionEnabled = true` を設定する
3. ポイントインタイムリカバリを有効化する
4. スキーマ変更の種類によっては手動のデータ移行が必要

これらの設定により、CloudFormation スタックを削除しても DynamoDB テーブルは AWS アカウントに残ります。
ただし、スキーマ変更の内容によっては自動的にテーブルが再作成されるため、事前のテストと計画が重要です。

## 本番環境でのデータ移行手順

スキーマ変更によってデータ構造の変換が必要な場合（JSON構造の変更、nullable→non-nullableの変更など）、以下の手順でデータ移行を実施します。

### 移行が必要なケース

1. **JSON構造の変更**: フィールド内のJSON構造が変わる場合
2. **Nullable → Non-nullable**: 既存のnullableフィールドを必須にする場合
3. **フィールドの分割/統合**: 1つのフィールドを複数に分割、または複数を1つに統合
4. **計算フィールドの追加**: 既存データから計算して新しい必須フィールドを設定

### 移行手順の全体フロー

```
1. メンテナンスモード有効化（API アクセス制限）
   ↓
2. データ移行スクリプト実行
   ↓
3. データ検証
   ↓
4. スキーマ変更のデプロイ
   ↓
5. メンテナンスモード解除
```

### 1. メンテナンスモードの設定

#### 方法A: AppSync API の一時的な無効化

```typescript
// amplify/backend.ts でメンテナンスモードを設定
import { defineBackend } from '@aws-amplify/backend';
import { CfnGraphQLApi } from 'aws-cdk-lib/aws-appsync';

const backend = defineBackend({
  auth,
  data,
});

// メンテナンスモード時はこのコードを有効化
const cfnGraphQLApi = backend.data.resources.graphqlApi.node.defaultChild as CfnGraphQLApi;
cfnGraphQLApi.xrayEnabled = false; // APIを実質的に無効化

// または、認証モードを一時的に削除
// backend.data.resources.cfnResources.cfnGraphqlApi.additionalAuthenticationProviders = [];
```

#### 方法B: WAF ルールでアクセス制限

```typescript
import { CfnWebACL, CfnWebACLAssociation } from 'aws-cdk-lib/aws-wafv2';

// メンテナンスモード用のWAFルール
const maintenanceWaf = new CfnWebACL(backend.data, 'MaintenanceWAF', {
  defaultAction: { block: {} }, // すべてブロック
  scope: 'REGIONAL',
  visibilityConfig: {
    cloudWatchMetricsEnabled: true,
    metricName: 'MaintenanceMode',
    sampledRequestsEnabled: true,
  },
  rules: [{
    name: 'AllowAdminIP',
    priority: 1,
    statement: {
      ipSetReferenceStatement: {
        arn: 'arn:aws:wafv2:region:account-id:regional/ipset/admin-ips/xxx',
      },
    },
    action: { allow: {} },
    visibilityConfig: {
      cloudWatchMetricsEnabled: true,
      metricName: 'AllowAdminIP',
      sampledRequestsEnabled: true,
    },
  }],
});
```

#### 方法C: フロントエンドでのメンテナンスモード制御

```typescript
// src/config.ts
export const MAINTENANCE_MODE = process.env.REACT_APP_MAINTENANCE_MODE === 'true';

// src/App.tsx
import { MAINTENANCE_MODE } from './config';

function App() {
  if (MAINTENANCE_MODE) {
    return <MaintenancePage />;
  }
  // 通常のアプリケーション
}
```

### 2. データ移行スクリプト

#### 例1: JSON構造の変更

```typescript
// scripts/migrate-filter-structure.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
  BatchWriteCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ap-northeast-1" });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "FilterSet-xxxxx-main"; // 実際のテーブル名に置き換え

interface OldFilterStructure {
  id: string;
  apiId: string;
  name: string;
  fetch: string;
  filters: string; // 旧: JSON文字列 "{"type":"genre","value":"fiction"}"
}

interface NewFilterStructure {
  id: string;
  apiId: string;
  name: string;
  fetch: string;
  filters: string; // 新: JSON文字列 "{"conditions":[{"type":"genre","value":"fiction"}]}"
}

async function migrateFilterStructure() {
  console.log('🔄 データ移行を開始します...');

  let processedCount = 0;
  let errorCount = 0;
  let lastEvaluatedKey: any = undefined;

  do {
    // テーブル全体をスキャン
    const scanResult = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      ExclusiveStartKey: lastEvaluatedKey,
      Limit: 25, // バッチサイズ
    }));

    const items = scanResult.Items as OldFilterStructure[];

    // 各アイテムを変換して更新
    for (const item of items || []) {
      try {
        // 旧構造をパース
        const oldFilter = JSON.parse(item.filters);

        // 新構造に変換
        const newFilter = {
          conditions: Array.isArray(oldFilter) ? oldFilter : [oldFilter],
          operator: 'AND', // デフォルト値を設定
        };

        // DynamoDBを更新
        await docClient.send(new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { id: item.id },
          UpdateExpression: 'SET filters = :filters, migratedAt = :migratedAt',
          ExpressionAttributeValues: {
            ':filters': JSON.stringify(newFilter),
            ':migratedAt': new Date().toISOString(),
          },
        }));

        processedCount++;
        console.log(`✅ ${processedCount}: ${item.id} を更新しました`);
      } catch (error) {
        errorCount++;
        console.error(`❌ ${item.id} の更新に失敗:`, error);
      }
    }

    lastEvaluatedKey = scanResult.LastEvaluatedKey;

    // 進捗表示
    console.log(`📊 進捗: ${processedCount}件処理完了, ${errorCount}件エラー`);

  } while (lastEvaluatedKey);

  console.log('✨ データ移行が完了しました');
  console.log(`📈 最終結果: 成功 ${processedCount}件, 失敗 ${errorCount}件`);
}

// 実行
migrateFilterStructure().catch(console.error);
```

#### 例2: Nullable → Non-nullable（必須フィールドの追加）

```typescript
// scripts/add-required-field.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ap-northeast-1" });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "Collection-xxxxx-main";

interface Collection {
  id: string;
  apiId: string;
  status: string;
  // 新しく追加する必須フィールド
  // createdAt?: string; // 既存データには存在しない
}

async function addRequiredField() {
  console.log('🔄 必須フィールドを追加します...');

  let processedCount = 0;
  let lastEvaluatedKey: any = undefined;

  do {
    const scanResult = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      ExclusiveStartKey: lastEvaluatedKey,
      FilterExpression: 'attribute_not_exists(createdAt)', // 既にフィールドがあるものは除外
      Limit: 25,
    }));

    const items = scanResult.Items as Collection[];

    for (const item of items || []) {
      try {
        // createdAt が無い場合は現在時刻を設定
        const createdAt = new Date().toISOString();

        await docClient.send(new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { id: item.id },
          UpdateExpression: 'SET createdAt = :createdAt, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':createdAt': createdAt,
            ':updatedAt': new Date().toISOString(),
          },
        }));

        processedCount++;
        console.log(`✅ ${processedCount}: ${item.id} に createdAt を追加しました`);
      } catch (error) {
        console.error(`❌ ${item.id} の更新に失敗:`, error);
      }
    }

    lastEvaluatedKey = scanResult.LastEvaluatedKey;
    console.log(`📊 進捗: ${processedCount}件処理完了`);

  } while (lastEvaluatedKey);

  console.log('✨ 必須フィールドの追加が完了しました');
}

addRequiredField().catch(console.error);
```

#### 例3: Lambda関数を使った移行（大規模データ向け）

```typescript
// amplify/functions/data-migration/handler.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { Handler } from 'aws-lambda';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: Handler = async (event) => {
  const { tableName, lastEvaluatedKey } = event;

  console.log(`Processing table: ${tableName}`);

  const scanResult = await docClient.send(new ScanCommand({
    TableName: tableName,
    ExclusiveStartKey: lastEvaluatedKey,
    Limit: 100,
  }));

  const items = scanResult.Items || [];
  const results = [];

  for (const item of items) {
    try {
      // データ変換ロジック
      const transformedData = transformData(item);

      await docClient.send(new UpdateCommand({
        TableName: tableName,
        Key: { id: item.id },
        UpdateExpression: 'SET #data = :data, migratedAt = :migratedAt',
        ExpressionAttributeNames: {
          '#data': 'filters',
        },
        ExpressionAttributeValues: {
          ':data': transformedData,
          ':migratedAt': new Date().toISOString(),
        },
      }));

      results.push({ id: item.id, status: 'success' });
    } catch (error) {
      console.error(`Failed to migrate ${item.id}:`, error);
      results.push({ id: item.id, status: 'failed', error: String(error) });
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      processed: items.length,
      results,
      lastEvaluatedKey: scanResult.LastEvaluatedKey,
      hasMore: !!scanResult.LastEvaluatedKey,
    }),
  };
};

function transformData(item: any): any {
  // 実際の変換ロジック
  const oldData = JSON.parse(item.filters);
  return JSON.stringify({
    conditions: Array.isArray(oldData) ? oldData : [oldData],
    operator: 'AND',
  });
}
```

### 3. データ検証スクリプト

```typescript
// scripts/validate-migration.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ap-northeast-1" });
const docClient = DynamoDBDocumentClient.from(client);

async function validateMigration(tableName: string) {
  console.log(`🔍 ${tableName} のデータを検証しています...`);

  let validCount = 0;
  let invalidCount = 0;
  let lastEvaluatedKey: any = undefined;

  do {
    const scanResult = await docClient.send(new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey,
    }));

    for (const item of scanResult.Items || []) {
      try {
        // 新しい構造でパースできるか確認
        const data = JSON.parse(item.filters);

        if (data.conditions && Array.isArray(data.conditions)) {
          validCount++;
        } else {
          invalidCount++;
          console.error(`❌ 無効なデータ: ${item.id}`, data);
        }
      } catch (error) {
        invalidCount++;
        console.error(`❌ パースエラー: ${item.id}`, error);
      }
    }

    lastEvaluatedKey = scanResult.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`\n📊 検証結果:`);
  console.log(`✅ 有効: ${validCount}件`);
  console.log(`❌ 無効: ${invalidCount}件`);

  if (invalidCount === 0) {
    console.log('🎉 すべてのデータが正しく移行されています！');
  } else {
    console.error('⚠️  無効なデータが存在します。修正が必要です。');
    process.exit(1);
  }
}

validateMigration("FilterSet-xxxxx-main").catch(console.error);
```

### 4. 実行手順

```bash
# 1. メンテナンスモードを有効化
# (amplify/backend.ts を編集してデプロイ、または環境変数を設定)
npx ampx pipeline-deploy --branch main --app-id <app-id>

# 2. データ移行スクリプトを実行
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
npx tsx scripts/migrate-filter-structure.ts

# 3. データ検証
npx tsx scripts/validate-migration.ts

# 4. スキーマを変更
# (amplify/data/resource.ts を編集)

# 5. デプロイ
git add .
git commit -m "feat: スキーマ変更とデータ移行"
git push origin main

# 6. デプロイ完了後、メンテナンスモードを解除
# (amplify/backend.ts からメンテナンス設定を削除してデプロイ)
```

### 5. ロールバック手順

移行に失敗した場合は、ポイントインタイムリカバリを使って復元します。

```bash
# 移行前の時点にテーブルを復元
aws dynamodb restore-table-to-point-in-time \
  --source-table-name FilterSet-xxxxx-main \
  --target-table-name FilterSet-xxxxx-main-restored \
  --restore-date-time <移行前のUNIXタイムスタンプ>

# 復元したテーブルを確認後、元のテーブルと入れ替え
# 1. 元のテーブルを削除（要注意！）
# 2. 復元したテーブルを元の名前にリネーム（またはアプリケーション設定を変更）
```

### 注意事項

1. **本番環境での実行前に必ずステージング環境でテスト**
2. **大規模データ（10万件以上）の場合はLambda関数を使用**
3. **移行中はユーザーアクセスを完全にブロック**（データ不整合防止）
4. **移行前に必ずバックアップを取得**（PITRまたはオンデマンドバックアップ）
5. **DynamoDB のスロットリングに注意**（必要に応じて Limit を調整）
6. **移行スクリプトは冪等性を確保**（同じスクリプトを複数回実行しても安全）

## DynamoDB テーブル名の管理

### テーブル名の自動生成形式

AWS Amplify Gen 2 では、DynamoDB テーブル名は以下の形式で自動生成されます：

```
<model-name>-<aws-appsync-api-id>-<amplify-api-environment-name>
```

**例:**
- `Collection-<appsync-api-id>-NONE`
- `FilterSet-<appsync-api-id>-NONE`

### 現在の制限事項

1. **予測不能な AppSync API ID**: ランダムな26文字の英数字ID（例: `abc123def456ghi789jkl012mn3`）が自動生成され、事前に予測できない
2. **環境名が "NONE" になる**: サンドボックスでも本番でも、環境名部分が `NONE` になることが多い
3. **ブランチ名が反映されない**: main ブランチと feature ブランチで異なるテーブルが作成されるが、名前からは区別できない
4. **カスタマイズが困難**: 公式にはテーブル名を直接変更する方法が提供されていない

### テーブル名を特定する方法

以下のスクリプトを実行することで、環境ごとのテーブル名を確認できます。

```bash
./scripts/get-table-names.sh
```

詳細は「[テーブル名の取得方法](#テーブル名の取得方法)」セクションを参照してください。

### Lambda 関数でテーブル名を使用する方法

Lambda 関数などでテーブル名を使用する場合、環境変数として渡すことを推奨します。

```typescript
// amplify/backend.ts
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { myFunction } from './functions/my-function/resource';

const backend = defineBackend({
  auth,
  data,
  myFunction,
});

// Lambda 関数にテーブル名を環境変数として渡す
backend.myFunction.addEnvironment(
  'COLLECTION_TABLE_NAME',
  backend.data.resources.tables.Collection.tableName
);

backend.myFunction.addEnvironment(
  'FILTERSET_TABLE_NAME',
  backend.data.resources.tables.FilterSet.tableName
);

// テーブルへのアクセス権限を付与
backend.myFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem', 'dynamodb:Query', 'dynamodb:Scan'],
    resources: [
      backend.data.resources.tables.Collection.tableArn,
      backend.data.resources.tables.FilterSet.tableArn,
    ],
  })
);
```

Lambda 関数内での使用：

```typescript
// amplify/functions/my-function/handler.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  const tableName = process.env.COLLECTION_TABLE_NAME;

  const result = await docClient.send(new GetCommand({
    TableName: tableName,
    Key: { id: event.id },
  }));

  return result.Item;
};
```

### カスタムテーブル名の設定（非公式・非推奨）

**警告**: 以下の方法は private プロパティを使用するため、将来のバージョンで動作しなくなる可能性があります。

```typescript
// amplify/backend.ts
import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

const backend = defineBackend({
  auth,
  data,
});

// カスタムテーブル名を設定（非推奨）
const customTableName = 'MyApp-Collection-Production';

backend.data.resources.cfnResources.amplifyDynamoDbTables.Collection
  // @ts-expect-error - private property
  .resource
  .addPropertyOverride('TableName', customTableName);

// IAM ポリシーもカスタムテーブル名に対応させる必要がある
// （追加の設定が必要）
```

**この方法の問題点:**
- TypeScript エラーを抑制する必要がある
- Amplify の内部実装に依存している
- 将来のアップデートで破壊的変更が起きる可能性が高い
- IAM ポリシーなどの関連設定も手動で調整が必要

### 本番環境での推奨管理方法

#### 1. CloudFormation スタック名で管理

各ブランチのデプロイは異なる CloudFormation スタックとして管理されます：

```bash
# main ブランチのスタック
amplify-<app-id>-main-<hash>

# feature ブランチのスタック
amplify-<app-id>-feature-enhancement-<hash>
```

CloudFormation スタックからリソースを逆引きできます。

#### 2. タグベースの管理（将来的な機能）

現在は機能リクエスト中ですが、将来的には以下のようなタグが自動付与される予定：

```json
{
  "amplify:app-id": "d1234567890",
  "amplify:branch-name": "main",
  "amplify:deployment-type": "branch",
  "amplify:environment": "production"
}
```

#### 3. ドキュメントでの管理

プロジェクトのドキュメント（README.md など）に、環境ごとのテーブル名を記載：

```markdown
## DynamoDB テーブル

テーブル名の確認方法:
\`\`\`bash
./scripts/get-table-names.sh
\`\`\`

詳細は [AWS.md](./AWS.md) を参照してください。
```

### テーブル名の取得方法

このプロジェクトには、環境ごとのテーブル名を自動的に取得するスクリプトが用意されています。

#### スクリプトの実行

```bash
./scripts/get-table-names.sh
```

#### 出力例

```
=== AWS Amplify DynamoDB テーブル名取得 ===

プロジェクト: amplify-vite-react-template

方法1: CloudFormation スタックから取得（推奨）

本番環境（main ブランチ）:
  スタック: amplify-xxxxx-main-branch-xxxxx-data...
  AppSync API ID: xxxxxxxxxxxxxxxxxxxxx
  DynamoDB テーブル:
    - Collection-xxxxxxxxxxxxxxxxxxxxx-NONE
    - FilterSet-xxxxxxxxxxxxxxxxxxxxx-NONE
  ✓ 検証済み: Collection-xxxxxxxxxxxxxxxxxxxxx-NONE

サンドボックス環境:
  スタック: amplify-xxxxx-sandbox-xxxxx-data...
  AppSync API ID: xxxxxxxxxxxxxxxxxxxxx
  DynamoDB テーブル:
    - Collection-xxxxxxxxxxxxxxxxxxxxx-NONE
    - FilterSet-xxxxxxxxxxxxxxxxxxxxx-NONE

方法2: amplify_outputs.json から取得

AppSync API ID: xxxxxxxxxxxxxxxxxxxxx
DynamoDB テーブル:
  - Collection-xxxxxxxxxxxxxxxxxxxxx-NONE
  - FilterSet-xxxxxxxxxxxxxxxxxxxxx-NONE

注意: これは現在アクティブなサンドボックス環境のテーブル名です。
本番環境とは異なる可能性があります。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
使用方法:
  データ移行スクリプトで上記のテーブル名を使用してください。
  本番環境のデータを移行する場合は、main ブランチのテーブル名を使用してください。
```

#### 使用上の注意

⚠️ **重要**:
- **本番環境のテーブル名**: CloudFormation スタックから取得される「本番環境（main ブランチ）」のテーブル名を使用してください
- **サンドボックス環境**: `tmp/amplify_outputs.json` に記載されている AppSync API ID は、現在アクティブなサンドボックス環境のものです
- **データ移行時**: 必ず対象環境（本番 or サンドボックス）のテーブル名を確認してから実行してください

#### 手動で確認する方法

スクリプトが使用できない場合、以下のコマンドで手動確認できます：

```bash
# CloudFormation スタック一覧を表示
aws cloudformation list-stacks \
  --region ap-northeast-1 \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
  --query 'StackSummaries[?contains(StackName, `amplify`)].StackName'

# 特定のスタックからテーブル名を取得
aws cloudformation describe-stacks \
  --stack-name <スタック名> \
  --region ap-northeast-1 \
  --query 'Stacks[0].Outputs[?contains(OutputKey, `TableName`)].OutputValue'
```

### まとめ

- **テーブル名の直接カスタマイズは公式にサポートされていない**
- **`backend.data.resources.tables.{MODEL}.tableName` で動的に取得する**のが推奨
- **環境変数や SSM パラメータでテーブル名を管理**する
- **本番環境では CloudFormation スタックやタグで管理**する
- **ドキュメントに明記**して、チーム全体で共有する

## 参考リンク

- [AWS Amplify Gen 2 - Deletion protection and Backup resources](https://docs.amplify.aws/react/build-a-backend/add-aws-services/deletion-backup-resources/)
- [AWS Amplify Gen 2 - Modify Amplify-generated AWS resources](https://docs.amplify.aws/react/build-a-backend/data/override-resources/)
- [AWS CDK - RemovalPolicy](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.RemovalPolicy.html)
- [AWS DynamoDB - Batch Operations](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html#WorkingWithItems.BatchOperations)
- [GitHub Issue: How to rename DynamoDB tables in Gen 2?](https://github.com/aws-amplify/amplify-category-api/issues/2991)
- [GitHub Issue: Unable to identify DynamoDB tables in the sandbox environment](https://github.com/aws-amplify/amplify-category-api/issues/2577)
