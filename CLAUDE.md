# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリでコードを操作する際のガイダンスを提供します。

## プロジェクト概要

これは認証、GraphQL API、DynamoDBデータベースを備えたAWS Amplify Gen 2 Reactアプリケーション（Vite使用）です。リアルタイム更新機能を持つシンプルなTodoアプリケーションのデモです。

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
