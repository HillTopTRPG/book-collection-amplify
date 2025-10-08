#!/bin/bash
# scripts/get-table-names.sh
# AWS Amplify Gen 2 の DynamoDB テーブル名を取得するスクリプト

set -e

# カラー出力
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

REGION="ap-northeast-1"

echo -e "${BLUE}=== AWS Amplify DynamoDB テーブル名取得 ===${NC}"
echo ""

# プロジェクト名を取得（package.json から）
if [ -f "package.json" ]; then
  PROJECT_NAME=$(cat package.json | grep '"name"' | head -1 | sed 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
  echo -e "${GREEN}プロジェクト:${NC} $PROJECT_NAME"
  echo ""
fi

echo -e "${BLUE}方法1: CloudFormation スタックから取得（推奨）${NC}"
echo ""

# CloudFormation スタックを取得
STACKS=$(aws cloudformation list-stacks \
  --region "$REGION" \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
  --query 'StackSummaries[?contains(StackName, `amplify`)].StackName' \
  --output json 2>/dev/null)

if [ -z "$STACKS" ] || [ "$STACKS" = "[]" ]; then
  echo -e "${YELLOW}警告: CloudFormation スタックが見つかりませんでした${NC}"
else
  # main ブランチのスタックを検索
  MAIN_STACK=$(echo "$STACKS" | jq -r '.[] | select(contains("-main-branch-"))' | head -1)

  if [ -n "$MAIN_STACK" ]; then
    # データスタックを見つける（NestedStackでないもの）
    DATA_STACK=$(echo "$STACKS" | jq -r '.[] | select(contains("-main-branch-") and contains("-data") and (contains("db-data") or contains("d9-data")) and (contains("NestedStack") | not))' | head -1)

    if [ -n "$DATA_STACK" ]; then
      echo -e "${GREEN}本番環境（main ブランチ）:${NC}"
      echo -e "  ${BLUE}スタック:${NC} $DATA_STACK"
    else
      echo -e "${GREEN}本番環境（main ブランチ）:${NC}"
      echo -e "  ${BLUE}スタック:${NC} $MAIN_STACK"
    fi

    if [ -n "$DATA_STACK" ]; then
      # AppSync API ID を取得
      API_ID=$(aws cloudformation list-stack-resources \
        --stack-name "$DATA_STACK" \
        --region "$REGION" \
        --query 'StackResourceSummaries[?ResourceType==`AWS::AppSync::GraphQLApi`].PhysicalResourceId' \
        --output text 2>/dev/null | sed 's/.*\///')

      if [ -n "$API_ID" ]; then
        echo -e "  ${BLUE}AppSync API ID:${NC} $API_ID"

        # テーブル名を構築
        echo -e "  ${GREEN}DynamoDB テーブル:${NC}"
        echo -e "    - Collection-${API_ID}-NONE"
        echo -e "    - FilterSet-${API_ID}-NONE"

        # 実際のテーブル名を CloudFormation から取得して検証
        COLLECTION_STACK=$(echo "$STACKS" | jq -r ".[] | select(contains(\"${MAIN_STACK:0:40}\") and contains(\"Collection\"))" | head -1)
        if [ -n "$COLLECTION_STACK" ]; then
          ACTUAL_TABLE=$(aws cloudformation describe-stacks \
            --stack-name "$COLLECTION_STACK" \
            --region "$REGION" \
            --query 'Stacks[0].Outputs[?contains(OutputKey, `TableName`)].OutputValue' \
            --output text 2>/dev/null)

          if [ -n "$ACTUAL_TABLE" ]; then
            echo -e "  ${GREEN}✓ 検証済み:${NC} $ACTUAL_TABLE"
          fi
        fi
      fi
    fi
    echo ""
  fi

  # サンドボックス環境のスタックを検索
  SANDBOX_STACKS=$(echo "$STACKS" | jq -r '.[] | select(contains("-sandbox-"))' | grep -v "NestedStack")

  if [ -n "$SANDBOX_STACKS" ]; then
    echo -e "${GREEN}サンドボックス環境:${NC}"

    for SANDBOX_STACK in $SANDBOX_STACKS; do
      # データスタックを見つける
      SANDBOX_DATA_STACK=$(echo "$STACKS" | jq -r ".[] | select(contains(\"${SANDBOX_STACK}\") and contains(\"-data\"))" | head -1)

      if [ -n "$SANDBOX_DATA_STACK" ]; then
        # AppSync API ID を取得
        SANDBOX_API_ID=$(aws cloudformation list-stack-resources \
          --stack-name "$SANDBOX_DATA_STACK" \
          --region "$REGION" \
          --query 'StackResourceSummaries[?ResourceType==`AWS::AppSync::GraphQLApi`].PhysicalResourceId' \
          --output text 2>/dev/null | sed 's/.*\///')

        if [ -n "$SANDBOX_API_ID" ]; then
          echo -e "  ${BLUE}スタック:${NC} $SANDBOX_STACK"
          echo -e "  ${BLUE}AppSync API ID:${NC} $SANDBOX_API_ID"
          echo -e "  ${GREEN}DynamoDB テーブル:${NC}"
          echo -e "    - Collection-${SANDBOX_API_ID}-NONE"
          echo -e "    - FilterSet-${SANDBOX_API_ID}-NONE"
          echo ""
        fi
      fi
    done
  fi
fi

echo ""
echo -e "${BLUE}方法2: amplify_outputs.json から取得${NC}"
echo ""

# amplify_outputs.json の存在確認
if [ -f "tmp/amplify_outputs.json" ]; then
  API_ID=$(cat tmp/amplify_outputs.json | grep -o '"url"[[:space:]]*:[[:space:]]*"https://[^.]*' | sed 's/.*https:\/\///')

  if [ -n "$API_ID" ]; then
    echo -e "${GREEN}AppSync API ID:${NC} $API_ID"
    echo -e "${GREEN}DynamoDB テーブル:${NC}"
    echo -e "  - Collection-${API_ID}-NONE"
    echo -e "  - FilterSet-${API_ID}-NONE"
    echo ""
    echo -e "${YELLOW}注意: これは現在アクティブなサンドボックス環境のテーブル名です。${NC}"
    echo -e "${YELLOW}本番環境とは異なる可能性があります。${NC}"
  fi
else
  echo -e "${YELLOW}tmp/amplify_outputs.json が見つかりません${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}使用方法:${NC}"
echo "  データ移行スクリプトで上記のテーブル名を使用してください。"
echo "  本番環境のデータを移行する場合は、main ブランチのテーブル名を使用してください。"
