index.tsxファイルをフォルダ名に基づいてリネームし、全ての参照元のimport文を自動修正します。

## 対象ファイルの選出方法

**IMPORTANT**: このコマンドは**必ず1ファイルのみ**を対象とします。複数のファイルを自動的に処理してはいけません。

以下の優先順位で対象ファイルを特定してください：

1. **コマンド引数がある場合**: `/rename-index src/components/Foo/index.tsx` のように引数で指定されたファイルを使用
2. **引数がない場合**: 直前のユーザーメッセージやシステムリマインダーを確認し、以下のパターンでファイルパスを探す
   - "selected the lines" で始まるシステムリマインダー内のファイルパス（最優先）
   - "opened the file" で始まるシステムリマインダー内のファイルパス
   - ユーザーが明示的に指定したファイルパス
3. **上記で特定できない場合**: **処理を開始せず**、以下の日本語メッセージを出力してユーザーの入力を待つ

```
対象の index.tsx または index.ts ファイルのパスを指定してください。

例: src/components/BookList/index.tsx
```

**重要**:

- 対象ファイルが特定できたら、それがindex.tsx/index.tsファイルであることを確認してから処理を開始
- 対象ファイルが特定できない場合は、**絶対に**自動で全てのindex.tsxを処理しない
- 必ず1ファイルのみを処理対象とする

## 自動実行の指示

**IMPORTANT**: 対象ファイルが特定できた後の以下の操作は、**ユーザーの確認を求めず自動実行**してください:

1. ファイルのリネーム（Bashツールでmvコマンド）
2. 全てのimport文の修正（Editツール）
3. `npm run lint:fix` の実行
4. `npm run lint` の実行

## 処理手順

1. 対象のindex.tsx/index.tsファイルの親フォルダ名を特定する
   - 例: `src/components/BookList/index.tsx` → フォルダ名は `BookList`
2. フォルダ名と同じ名前のファイルにリネームする
   - 例: `BookList/index.tsx` → `BookList/BookList.tsx`
   - 例: `SearchForm/index.ts` → `SearchForm/SearchForm.ts`
3. Grepツールでプロジェクト全体からこのファイルのimport文を検索する
   - 相対パス: `from './BookList'`, `from '../BookList'`
   - 絶対パス: `from '@/components/BookList'`
   - re-export: `export * from './BookList'`, `export { default } from './BookList'`
4. 見つかった全てのimport/export文をEditツールで修正する
   - `from './BookList'` → `from './BookList/BookList'`
   - `from '@/components/BookList'` → `from '@/components/BookList/BookList'`
   - `export * from './BookList'` → `export * from './BookList/BookList'`
5. `npm run lint:fix`を実行（自動修正可能な問題を解決）
6. `npm run lint`を実行（エラーがないことを確認）
7. 変更内容のサマリーを報告
   - リネームしたファイルパス（変更前 → 変更後）
   - 修正したファイルの数とファイル名一覧
   - lint結果

## 注意事項

- import/export文の修正はパスの修正のみを行い、インポートの並び順やフォーマットはlint:fixに任せる
- 動的importにも対応する（例: `import('./BookList')`）
- コメント内のパス参照は修正しない
- 全ての操作を確認プロンプトなしで自動実行し、完了後に簡潔なサマリーを報告する
