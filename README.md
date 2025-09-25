# マイ書目コンシェルジュ - 書籍コレクション管理アプリ

<!-- Badges -->
<div align="center">

<!-- GitHub Stats -->

[![GitHub Stars](https://img.shields.io/github/stars/HillTopTRPG/book-collection-amplify?style=flat&logo=github&color=yellow)](https://github.com/HillTopTRPG/book-collection-amplify/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/HillTopTRPG/book-collection-amplify?style=flat&logo=github&color=blue)](https://github.com/HillTopTRPG/book-collection-amplify/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/HillTopTRPG/book-collection-amplify?style=flat&logo=github&color=red)](https://github.com/HillTopTRPG/book-collection-amplify/issues)
[![GitHub License](https://img.shields.io/github/license/HillTopTRPG/book-collection-amplify?style=flat&color=green)](https://github.com/HillTopTRPG/book-collection-amplify/blob/main/LICENSE)

<!-- Tech Stack -->

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.4-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0.7-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![AWS Amplify](https://img.shields.io/badge/AWS%20Amplify-FF9900?style=flat&logo=aws-amplify&logoColor=white)](https://aws.amazon.com/amplify/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

<!-- CI/CD -->

[![CI Status](https://img.shields.io/github/actions/workflow/status/HillTopTRPG/book-collection-amplify/ci.yml?style=flat&logo=github-actions&logoColor=white)](https://github.com/HillTopTRPG/book-collection-amplify/actions/workflows/ci.yml)
[![Lighthouse](https://img.shields.io/github/actions/workflow/status/HillTopTRPG/book-collection-amplify/lighthouse.yml?style=flat&logo=lighthouse&logoColor=white&label=Lighthouse)](https://github.com/HillTopTRPG/book-collection-amplify/actions/workflows/lighthouse.yml)

<!-- Code Quality -->

[![Code Size](https://img.shields.io/github/languages/code-size/HillTopTRPG/book-collection-amplify?style=flat&color=purple)](https://github.com/HillTopTRPG/book-collection-amplify)
[![Top Language](https://img.shields.io/github/languages/top/HillTopTRPG/book-collection-amplify?style=flat&color=orange)](https://github.com/HillTopTRPG/book-collection-amplify)
[![Last Commit](https://img.shields.io/github/last-commit/HillTopTRPG/book-collection-amplify?style=flat&color=brightgreen)](https://github.com/HillTopTRPG/book-collection-amplify/commits/main)

</div>

**マイ書目コンシェルジュ**は、書籍のバーコードスキャンやISBN入力により、個人の蔵書を効率的に管理できるモバイルフレンドリーなWebアプリケーションです。AWS Amplify Gen 2を活用し、認証機能とリアルタイムデータ同期を備えた現代的な書籍管理ソリューションを提供します。

## 📖 アプリケーション概要

### 主要機能
- **📱 バーコードスキャン**: カメラを使用して書籍のISBNバーコードを読み取り、書籍情報を自動取得
- **📚 コレクション管理**: 個人の蔵書をデジタルで管理・検索・フィルタリング
- **🔍 高度な検索**: カスタムフィルターセットによる柔軟な書籍検索
- **📝 メモ機能**: 各書籍に対する個人的なメモやレビューの記録
- **🔐 ユーザー認証**: AWS Cognitoによる安全なユーザー管理
- **☁️ クラウド同期**: リアルタイムデータ同期による複数デバイス対応

### 対象ユーザー
- 大量の書籍コレクションを管理したい書籍愛好家
- 図書館や書店での蔵書管理システムを必要とする組織
- デジタル書籍管理に興味がある個人・団体

## 🚀 開発コマンド

### 開発環境
```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# ビルドのプレビュー
npm run preview
```

### コード品質・テスト
```bash
# 自動修正（推奨）
npm run lint:fix

# リント・型チェック
npm run lint

# テスト実行
npm run test
npm run test:run        # watch無し
npm run test:coverage   # カバレッジ付き
```

### AWS Amplify
```bash
# ローカルAmplifyサンドボックス起動
npx ampx sandbox

# サンドボックス削除
npx ampx sandbox delete

# AWSデプロイ
npx ampx pipeline-deploy --branch <branch-name> --app-id <app-id>
```

## 🛠️ 使用技術スタック

### フロントエンド
| 技術 | 用途 |
|------|------|
| **React 19.1.1** | UIライブラリ - コンポーネントベースの効率的な開発 |
| **TypeScript** | 静的型付け - 開発時の型安全性とIDE支援 |
| **Vite** | ビルドツール - 高速な開発サーバーと最適化されたビルド |
| **Tailwind CSS** | CSSフレームワーク - ユーティリティファーストなスタイリング |
| **Radix UI** | UIコンポーネント - アクセシビリティに配慮されたプリミティブ |

### 状態管理・フォーム
| 技術 | 用途 |
|------|------|
| **Redux Toolkit** | 状態管理 - アプリケーション全体の複雑な状態管理 |
| **React Hook Form** | フォーム管理 - バリデーション付きの効率的なフォーム制御 |
| **Zod** | バリデーション - TypeScriptファーストなスキーマ検証 |

### バックエンド・インフラ
| 技術 | 用途 |
|------|------|
| **AWS Amplify Gen 2** | フルスタック開発プラットフォーム - バックエンドとフロントエンドの統合 |
| **Amazon Cognito** | 認証サービス - ユーザー登録・ログイン・権限管理 |
| **AWS AppSync** | GraphQL API - リアルタイムデータ同期とAPI管理 |
| **Amazon DynamoDB** | NoSQLデータベース - 高性能なデータストレージ |

### 機能特化ライブラリ
| 技術 | 用途 |
|------|------|
| **Quagga2** | バーコード読み取り - カメラを使用したISBN読み取り機能 |
| **DND Kit** | ドラッグ&ドロップ - 直感的なUI操作の実装 |
| **Framer Motion** | アニメーション - 滑らかなUI遷移とインタラクション |
| **React Router** | ルーティング - SPA内での画面遷移管理 |

### 開発・品質管理
| 技術 | 用途 |
|------|------|
| **ESLint** | 静的解析 - コード品質の一貫性保持 |
| **Prettier** | コードフォーマット - 統一されたコードスタイル |
| **Vitest** | テストフレームワーク - 高速なユニット・統合テスト |
| **Husky** | Gitフック - コミット前の自動品質チェック |
| **GitHub Actions** | CI/CD - 自動テスト・ビルド・デプロイ |

## 📄 ライセンス

このプロジェクトはMIT-0ライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルをご確認ください。
