import type React from "react";
import { Composition, registerRoot } from "remotion";
import { AffiliateVideo, AffiliateVideoProps } from "./AffiliateVideo";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="AffiliateVideo"
    component={AffiliateVideo}
    durationInFrames={30 * 30}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{
      productName: "Sản phẩm affiliate",
      hook: "Bạn có đang bỏ lỡ món này?",
      script: "Video giới thiệu sản phẩm ngắn gọn, rõ lợi ích và trung thực.",
      cta: "Xem sản phẩm ở bio",
      subtitles: [],
    }}
  />
);

registerRoot(RemotionRoot);
