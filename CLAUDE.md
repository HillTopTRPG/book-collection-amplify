# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリでコードを操作する際のガイダンスを提供します。

## プロジェクト概要

これは認証、GraphQL API、DynamoDBデータベースを備えたAWS Amplify Gen 2 Reactアプリケーション（Vite使用）です。リアルタイム更新機能を持つシンプルなTodoアプリケーションのデモです。

## 開発環境

- **IDE**: WebStorm

## コマンド

```
Start session url: https://null.awsapps.com/start
Region: ap-northeast-1
Username: amplify-admin
```

### 開発

- `npm run dev` - Viteで開発サーバーを起動
- `npm run build` - TypeScriptコンパイルと本番ビルド
- `npm run preview` - 本番ビルドをローカルでプレビュー
- `npm run lint` - TypeScriptサポート付きでESLintを実行
- `npm run lint:fix` - ESLintの自動修正を実行

### Claude Codeの作業フロー

**重要**: リンティングチェック時は必ず以下の順序で実行してください：

1. `npm run lint:fix` - 自動修正可能な問題を先に修正
2. `npm run lint` - 残りの問題を確認

これによりClaude Codeの手動修正コストを軽減できます。

### Amplifyバックエンド

- `npx ampx sandbox` - ローカルAmplifyサンドボックス環境を実行
- `npx ampx pipeline-deploy --branch <branch> --app-id <app-id>` - AWSにデプロイ

## アーキテクチャ

### フロントエンド構造

- **React + Vite**: 高速HMRを備えたモダンなReactセットアップ
- **TypeScript**: 全体を通じた厳密な型付け
- **Amplify UI**: `@aws-amplify/ui-react`による事前構築済み認証コンポーネント
- **リアルタイムデータ**: DynamoDBからのライブ更新に`observeQuery()`を使用

### バックエンド構造

- **amplify/backend.ts**: 認証とデータリソースを組み合わせたメインバックエンド定義
- **amplify/auth/resource.ts**: メールログインでのCognito認証
- **amplify/data/resource.ts**: パブリックAPIキー認証を使用するTodoモデルのGraphQLスキーマ
- **API認証**: 簡素化のため現在はパブリックAPIキー（30日間の有効期限）を使用

### データフロー

1. Reactコンポーネントは`generateClient<Schema>()`を使用して型付きGraphQLクライアントを作成
2. クライアントがAppSync GraphQL APIに接続
3. `observeQuery()`によるリアルタイムサブスクリプションがUIを自動更新
4. DynamoDBが自動スケーリングで永続化ストレージを提供

## 重要なファイル

- `src/index.tsx` - Todo CRUD操作を持つメインアプリケーションコンポーネント
- `amplify/data/resource.ts` - GraphQLスキーマ定義（Todoモデル拡張用の開発コメントを含む）
- `amplify.yml` - CI/CDパイプライン用AWSビルド設定

## ドキュメント管理

### キューイングシステムドキュメント (`queuing.md`)

本プロジェクトでは、API レート制限対策としてキューイングシステムを実装しています。その仕様は `queuing.md` に記載されています。

**定期更新が必要**: キューイングシステムの実装を変更した後は、`queuing.md` を実装と同期させる必要があります。

#### 更新作業の手順

1. **更新ガイドを参照**: `.claude/queuing-update-guide.md` に詳細な更新手順が記載されています
2. **実装の変更点を確認**: 以下のファイルをチェック
   - Redux Slice: `src/store/*Slice.ts`（キュー定義）
   - Processor: `src/App/ApplicationControlLayer/use*Processor.ts`（処理ロジック）
   - 統合レイヤー: `src/App/ApplicationControlLayer/QueueProcessLayer.tsx`（設定値）
   - 共通関数: `src/utils/store.ts`（enqueue/dequeue）
3. **queuing.mdを更新**: 変更があった箇所を特定し、該当セクションを修正
   - 並行実行数（selectorの`slice`範囲）
   - リトライ間隔（`timeoutInterval`の値）
   - エンキュー/デキュー条件（`enqueue`/`dequeue`関数のロジック）
   - 処理フロー（Mermaid図）

#### チェックポイント

- **並行実行数**: 各Sliceの`selector`で`queue.slice(0, N)`のNを確認
- **リトライ間隔**: `QueueProcessLayer.tsx`の`useSearchQueueProcessor`の`timeoutInterval`を確認
- **処理ロジック**: 各Processorの`useEffect`内の処理順序を確認

#### 注意事項

- Mermaid図は実装と正確に一致させること
- LocalStorage連携はスキャンキューのみ（特殊処理）
- コード引用時は正確なファイルパスと行番号を記載
