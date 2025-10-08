# コンポーネントファイル構造リファクタリングガイド

## 背景

### 現在の構造（index.tsx方式）

```
BookList/
  index.tsx         # メインコンポーネント
  BookListItem.tsx  # 子コンポーネント
  BookListHeader.tsx
```

### 新しい構造（明示的命名方式）

```
BookList/
  BookList.tsx      # メインコンポーネント
  BookListItem.tsx  # 子コンポーネント
  BookListHeader.tsx
```

## 移行理由

**メリット**:

1. **判別性が高い** - IDEで `BookList.tsx`, `TodoList.tsx` のように並び、一目で識別可能
2. **主従関係が明確** - ファイル名だけで「これがメイン」と分かる
3. **エディタタブでの見やすさ** - タブに「BookList.tsx」と表示され、index.tsxの羅列を回避
4. **コードジャンプが直感的** - 定義元へのジャンプ時に意図したファイルが開く

**デメリット**:

- import文が冗長になる（`from './BookList/BookList'`）
- ただし、IDEの自動import機能により実務上の影響は小さい

## リファクタリング戦略

### 段階的な移行方針

1. **新規コンポーネント**: 新しい方式で作成
2. **既存コンポーネント**: 編集時に順次リネーム
3. **一括変換は避ける**: リスクが高いため、必要に応じて個別対応

### 変更対象の選定基準

以下のタイミングでリファクタリングを検討：

- コンポーネントに大きな変更を加える時
- IDEでのファイル識別に困った時
- コードレビューで混乱が生じた時

## Claude Codeでのリファクタリング手順

### 1. Slash Commandの使用方法

```
/rename-index
src/components/BookList/index.tsx
```

**実行内容**:

1. `BookList/index.tsx` → `BookList/BookList.tsx` にリネーム
2. プロジェクト全体のimport文を自動検索・修正
3. lint:fix → lint を実行して品質確認
4. 変更サマリーをレポート

### 2. 手動指示での実行

Slash Commandを使わない場合は、以下のように指示：

```
src/components/BookList/index.tsx を BookList.tsx にリファクタリングして。
ファイル名の変更と、全ての参照元のimport文を修正してください。
```

### 3. 複数ファイルの一括変換（非推奨）

どうしても必要な場合のみ：

```
以下のindex.tsxファイルをリファクタリングして：
- src/components/BookList/index.tsx
- src/components/TodoList/index.tsx
- src/components/UserProfile/index.tsx

各ファイルについて、ファイル名の変更とimport文の修正を行ってください。
```

**注意**: 変更範囲が大きいため、事前にgit commitを推奨

## 変更後の確認事項

### 自動チェック（Claude Codeが実行）

- [ ] lint:fix で自動修正可能な問題を解決
- [ ] lint でエラーがないことを確認

### 手動チェック（開発者が実行）

- [ ] `npm run dev` でアプリケーションが起動すること
- [ ] リファクタリングしたコンポーネントが正常に表示されること
- [ ] 関連する機能が動作すること
- [ ] git diff で意図しない変更がないこと

## トラブルシューティング

### import文の修正漏れ

**症状**: TypeScriptエラー `Cannot find module './BookList'`

**対処**:

```
"./BookList" をimportしている箇所を全て検索して、
"./BookList/BookList" に修正してください。
```

### 循環参照の発生

**症状**: ビルド時に循環参照エラー

**対処**:

- index.tsx が re-export の役割を担っていた可能性がある
- 元のindex.tsxを復元し、re-export構造を維持する

### 型定義ファイルの不整合

**症状**: 型importが解決できない

**対処**:

```
BookList/types.ts からの型importを確認して、
パスが正しいか検証してください。
```

## リファクタリング記録

移行したコンポーネントを記録しておくと管理しやすい：

### 完了

- [ ]

### 保留（理由を記載）

-

### 対象外（理由を記載）

-

## 参考: 採用実績のあるプロジェクト

明示的命名方式は以下のような大規模プロジェクトで採用されています：

- Material-UI (MUI)
- Ant Design
- React Bootstrap
- Chakra UI

## 関連ドキュメント

- [CLAUDE.md](./CLAUDE.md) - プロジェクト全体のClaude Code指示
- [.claude/slash-commands/rename-index.md](./.claude/slash-commands/rename-index.md) - Slash Commandの定義
