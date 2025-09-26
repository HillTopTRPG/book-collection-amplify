#!/bin/bash

# GitHub Actions ワークフロー実行履歴一括削除スクリプト
# 使用法: ./scripts/delete-workflow-runs.sh [workflow-name] [limit]

set -e

WORKFLOW_NAME="${1:-CI and Quality Checks}"
LIMIT="${2:-20}"  # デフォルト値を減らす

echo "🔍 ワークフロー「$WORKFLOW_NAME」の実行履歴を確認中..."

# ワークフロー実行履歴の取得
RUN_IDS=$(gh run list --workflow="$WORKFLOW_NAME" --limit "$LIMIT" --json databaseId --jq '.[].databaseId')

if [ -z "$RUN_IDS" ]; then
    echo "❌ 削除対象のワークフロー実行履歴が見つかりません"
    exit 1
fi

# 実行履歴の件数を表示
COUNT=$(echo "$RUN_IDS" | wc -l | xargs)
echo "📋 削除対象: $COUNT 件の実行履歴"

# 確認プロンプト
echo "⚠️  本当に削除しますか？ (y/N)"
read -r CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "❌ 削除をキャンセルしました"
    exit 0
fi

echo "🗑️  削除を開始します..."

# 各実行履歴を削除
DELETED_COUNT=0
FAILED_COUNT=0
TOTAL_COUNT=$(echo "$RUN_IDS" | wc -l | xargs)

for RUN_ID in $RUN_IDS; do
    CURRENT=$((DELETED_COUNT + FAILED_COUNT + 1))
    echo "[$CURRENT/$TOTAL_COUNT] 削除中: Run ID $RUN_ID"

    # 詳細なエラー情報を取得
    ERROR_MSG=$(gh run delete "$RUN_ID" 2>&1) || ERROR_CODE=$?

    if [ $? -eq 0 ]; then
        ((DELETED_COUNT++))
        echo "  ✅ 削除完了"
    else
        ((FAILED_COUNT++))
        echo "  ❌ 削除失敗: $ERROR_MSG"

        # レート制限エラーの場合は長めに待機
        if echo "$ERROR_MSG" | grep -i "rate limit\|too many requests" > /dev/null; then
            echo "  ⏰ レート制限検出。60秒待機します..."
            sleep 60
        elif echo "$ERROR_MSG" | grep -i "forbidden\|permission" > /dev/null; then
            echo "  🔒 権限エラー。このRunは削除できません。"
        fi
    fi

    # レート制限対策（基本待機時間を延長）
    sleep 1.5

    # 10回に1回、長めの休憩
    if [ $((CURRENT % 10)) -eq 0 ] && [ $CURRENT -lt $TOTAL_COUNT ]; then
        echo "  ⏸️  10件処理完了。10秒休憩します..."
        sleep 10
    fi
done

echo ""
echo "🎉 削除完了!"
echo "   ✅ 成功: $DELETED_COUNT 件"
echo "   ❌ 失敗: $FAILED_COUNT 件"

if [ $FAILED_COUNT -gt 0 ]; then
    echo "⚠️  一部削除に失敗した実行履歴があります"
    echo "   権限不足またはAPIレート制限の可能性があります"
fi