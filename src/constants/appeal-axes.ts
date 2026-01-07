// Appeal Axes Constants - 訴求軸の定数定義

export type AppealAxisId =
  | 'spec'
  | 'quality'
  | 'benefit'
  | 'emotion'
  | 'social'
  | 'urgency'
  | 'price'
  | 'ease'
  | 'authority';

export interface AppealAxis {
  id: AppealAxisId;
  label: string;
  description: string;
}

export const APPEAL_AXES: Record<AppealAxisId, Omit<AppealAxis, 'id'>> = {
  spec: {
    label: 'スペック訴求',
    description: '製品の具体的な仕様・機能',
  },
  quality: {
    label: '品質訴求',
    description: '品質の高さ・信頼性',
  },
  benefit: {
    label: 'ベネフィット訴求',
    description: '得られる具体的な利益',
  },
  emotion: {
    label: '感情変化訴求',
    description: '感情的な変化・体験',
  },
  social: {
    label: '社会的証明',
    description: '実績・利用者数・評価',
  },
  urgency: {
    label: '緊急性訴求',
    description: '期間限定・今だけ',
  },
  price: {
    label: '価格訴求',
    description: 'コスパ・割引・無料',
  },
  ease: {
    label: '簡便性訴求',
    description: '簡単・手軽・すぐできる',
  },
  authority: {
    label: '権威性訴求',
    description: '専門家・有名人の推薦',
  },
};

// UI選択用の配列形式
export const APPEAL_AXIS_OPTIONS: AppealAxis[] = Object.entries(APPEAL_AXES).map(
  ([id, config]) => ({
    id: id as AppealAxisId,
    ...config,
  })
);

// 訴求軸IDからラベルを取得するヘルパー
export function getAppealAxisLabel(id: AppealAxisId): string {
  return APPEAL_AXES[id]?.label ?? id;
}

// 複数の訴求軸IDからラベル配列を取得
export function getAppealAxisLabels(ids: AppealAxisId[]): string[] {
  return ids.map(getAppealAxisLabel);
}
