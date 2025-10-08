以下のindex.tsxファイルをフォルダ名に基づいてリネームし、全ての参照元のimport文を自動修正してください。

対象ファイル:

手順:
1. 指定されたindex.tsxのフォルダ名を特定する
2. フォルダ名と同じ名前の.tsxまたは.tsファイルにリネームする（例: BookList/index.tsx → BookList/BookList.tsx）
3. プロジェクト全体でこのファイルをimportしている箇所をGrepで検索する
4. 見つかった全てのimport文を修正する（例: from './BookList' → from './BookList/BookList'）
5. npm run lint:fixを実行し、自動修正可能な問題を解決する
6. npm run lintを実行し、エラーがないことを確認する
7. 変更内容のサマリーを報告する（リネームしたファイル、修正したimport文の数）

注意事項:
- import文の修正は相対パス、絶対パスの両方に対応すること
- TypeScriptの型import（import type）も忘れずに修正すること
- re-exportsがある場合も対応すること
