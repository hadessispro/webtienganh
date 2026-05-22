"use client";

/**
 * SafetyBanner
 * Always visible at top of the Groups list view. Reminds users that
 * LumaLang is a free community and they should report anyone asking
 * for payment outside the platform.
 */

export function SafetyBanner() {
  return (
    <div className="ll-grp-safety-banner" role="region" aria-label="Quy tắc cộng đồng">
      <span className="ll-grp-safety-icon" aria-hidden="true">🛡️</span>
      <div className="ll-grp-safety-body">
        <b>LumaLang là cộng đồng học miễn phí.</b> Không ai có quyền thu phí, dạy có thu phí,
        hoặc đòi chuyển khoản qua ứng dụng. Chat được tự động lọc số điện thoại, link tài chính,
        từ khóa thu phí. Hãy báo cáo ngay nếu có vi phạm.
      </div>
      <a className="ll-grp-safety-link" href="#community-rules">
        Quy tắc cộng đồng →
      </a>
    </div>
  );
}
