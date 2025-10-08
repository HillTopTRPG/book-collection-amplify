# キューイングドキュメント更新ガイド

このガイドは、`queuing.md` を実装と同期させるための作業手順です。

## 更新対象ファイル

### 1. キュー定義（Redux Slice）

- `src/store/scannerSlice.ts` - スキャンキュー
- `src/store/fetchBookImageSlice.ts` - 書影取得キュー
- `src/store/fetchGoogleSearchSlice.ts` - Google Books APIキュー
- `src/store/fetchRakutenSearchSlice.ts` - Rakuten Books APIキュー
- `src/store/fetchNdlSearchSlice.ts` - NDL検索キュー
- `src/store/ndlSearchSlice.ts` - All NDL検索キュー

### 2. キュー処理ロジック

- `src/App/ApplicationControlLayer/useSearchQueueProcessor.ts` - 汎用検索キュープロセッサー
- `src/App/ApplicationControlLayer/useBookImageQueueProcessor.ts` - 書影取得プロセッサー
- `src/App/ApplicationControlLayer/useScanQueueProcessor.ts` - スキャンプロセッサー
- `src/App/ApplicationControlLayer/useNdlSearchQueueEnqueueer.ts` - All NDL検索エンキュー処理
- `src/App/ApplicationControlLayer/QueueProcessLayer.tsx` - キュー処理統合レイヤー

### 3. 共通ユーティリティ

- `src/utils/store.ts` - キュー管理共通関数
  - `enqueue`/`dequeue` - エンキュー/デキュー処理
  - `createQueueTargetSelector` - キュー処理対象セレクター生成ヘルパー
- `src/utils/primitive.ts` - 基本的なユーティリティ関数
  - `unique` - 配列の重複排除
  - `arrayEqualityCheck` - 配列の等価性チェック
- `src/types/queue.ts` - キュー型定義

## チェックポイント

### A. キュー設定の確認

#### QueueProcessLayer.tsx

```typescript
// 各APIのtimeoutInterval（リトライ間隔）を確認
const google = useSearchQueueProcessor(..., 5000);    // Google: 5秒
const rakuten = useSearchQueueProcessor(..., 5000);   // Rakuten: 5秒
const ndl = useSearchQueueProcessor(..., 1000, ...);  // NDL: 1秒
```

#### 各Sliceのselector

```typescript
// 並行実行数を確認（createQueueTargetSelectorの第2引数）
selectGoogleSearchTargets = createQueueTargetSelector('fetchGoogleSearch', 1); // Google: 1件
selectRakutenSearchTargets = createQueueTargetSelector('fetchRakutenSearch', 1); // Rakuten: 1件
selectNdlSearchTargets = createQueueTargetSelector('fetchNdlSearch', 1); // NDL: 1件
selectAllNdlSearchTargets = createQueueTargetSelector('ndlSearch', 2); // All NDL: 2件
selectScanQueueTargets = createQueueTargetSelector('scanner', 1); // Scan: 1件
selectFetchBookImageQueueTargets = createQueueTargetSelector('fetchBookImage', 1); // BookImage: 1件
```

**注意**:

- セレクターは`createQueueTargetSelector`ヘルパー関数を使用して生成
- 並行実行数は第2引数で指定
- 型引数は不要（RootStateから自動推論される）

### B. エンキュー/デキュー条件の確認

#### utils/store.ts の enqueue 関数

```typescript
switch (action.payload.type) {
  case 'new':
    return result === undefined && !state.queue.includes(key);
  case 'retry':
    if (result !== 'retrying') return false;
    return state.queue.at(0) !== key;
  case 'priority':
  default:
    return result === undefined && state.queue.at(0) !== key;
}
```

#### 各Sliceのreducers

- `enqueueScan`, `dequeueScan` - スキャンキュー固有の処理（LocalStorage連携）
- `enqueueBookImage`, `dequeueBookImage` - 書影取得キュー
- その他のenqueue/dequeue - 標準的な処理

### C. 処理フローの確認

#### useBookImageQueueProcessor

- 処理1: NDL直接確認（全並列）
- 処理2: Google/Rakuten両方の結果待ち

#### useScanQueueProcessor

- 処理1: NDL検索キューへのenqueue
- 処理2: NDL検索結果からdequeue（成功時はLocalStorageに残す、失敗時は削除）

#### useNdlSearchQueueEnqueueer

- ページング処理の再帰的enqueue
- 全ページ取得完了時のdequeue

## 更新手順

### ステップ1: 実装の変更点を把握

1. 各Sliceファイルを読み、型定義・reducer・selectorの変更を確認
2. 各Processorファイルを読み、処理ロジックの変更を確認
3. QueueProcessLayer.tsxでtimeoutIntervalや実行間隔の変更を確認

### ステップ2: queuing.mdと比較

1. 「キュー一覧」セクション - 各キューの仕様
2. 「並行実行数」 - selectorのslice範囲
3. 「レート制限」 - timeoutIntervalの値
4. 「エンキュー条件」「デキュー条件」 - enqueue/dequeue関数のロジック
5. 「処理フロー」のMermaid図 - Processor内の処理順序

### ステップ3: queuing.mdを更新

- 変更があった箇所を特定し、該当セクションを更新
- Mermaid図が古い場合は、新しいフローに合わせて修正
- 「レート制限とリトライ戦略まとめ」の表も更新

## よくある変更パターン

### パターン1: リトライ間隔の変更

- QueueProcessLayer.tsxのtimeoutIntervalを確認
- 該当キューセクションの「リトライ戦略」と処理フローのMermaid図を更新
- 「レート制限とリトライ戦略まとめ」の表を更新

### パターン2: 並行実行数の変更

- 各Sliceのselectorで`createQueueTargetSelector`の第2引数（targetCount）を確認
  - 例: `createQueueTargetSelector('ndlSearch', 2)` → 並行2件
- 該当キューセクションの「並行実行数」を更新
- 「レート制限とリトライ戦略まとめ」の表を更新

### パターン3: エンキュー条件の変更

- utils/store.tsのenqueue関数を確認
- 該当キューセクションの「エンキュー条件」を更新
- 必要に応じて処理フローのMermaid図も更新

### パターン4: 新しいキューの追加

- 新しいSliceファイルを確認
- 「キュー一覧」に新しいセクションを追加
- QueueProcessLayerでの使用方法を確認し、処理フローを記載
- 「レート制限とリトライ戦略まとめ」の表に行を追加

### パターン5: 処理フローの変更

- Processorファイル内のuseEffect/コールバック処理を確認
- 該当キューの「処理フロー」Mermaid図を更新
- シーケンス図の順序や分岐条件が実装と一致するようにする

## 注意事項

1. **Mermaid記法の整合性**: 処理フローは必ずシーケンス図またはフローチャートで表現
2. **コード引用**: 実装を引用する際は正確なファイルパスと行番号を記載
3. **用語の統一**:
   - エンキュー（enqueue）
   - デキュー（dequeue）
   - リトライ（retry）
   - 並行実行数（concurrent execution count）
4. **LocalStorage連携**: スキャンキューは特殊な処理があるため注意
5. **型の正確性**: QueueTypeとQueueResultの型は各Sliceから正確に転記

## 確認コマンド

```bash
# 各Sliceの並行実行数を確認
grep -n "createQueueTargetSelector" src/store/*.ts

# timeoutIntervalの値を確認
grep -n "useSearchQueueProcessor" src/App/ApplicationControlLayer/QueueProcessLayer.tsx

# enqueue/dequeue関数とcreateQueueTargetSelectorのロジック確認
cat src/utils/store.ts
```

## 作業完了チェックリスト

- [ ] 全Sliceファイルの変更を確認した
- [ ] 全Processorファイルの変更を確認した
- [ ] QueueProcessLayer.tsxの設定値を確認した
- [ ] queuing.mdの各キューセクションを更新した
- [ ] Mermaid図が実装と一致している
- [ ] 「レート制限とリトライ戦略まとめ」の表を更新した
- [ ] コード引用の行番号が正確である
