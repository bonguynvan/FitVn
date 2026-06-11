# FitVN — Product Brief

> **Ứng dụng tập luyện + dinh dưỡng "all-in-one" đầu tiên thực sự dành cho người Việt.**
> PWA mobile-first, database thực phẩm Việt phong phú, AI Coach nói tiếng Việt hiểu ngữ cảnh.

| | |
|---|---|
| **Tên sản phẩm** | FitVN |
| **Loại** | Progressive Web App (PWA) — Web + cài như app trên điện thoại, không qua App Store/CH Play |
| **Stack** | Next.js 14 (App Router, TypeScript) · Supabase (Postgres + Auth + RLS) · Claude API (Vercel AI SDK) |
| **Thị trường** | Việt Nam (ưu tiên đô thị loại 1 & 2: TP.HCM, Hà Nội, Đà Nẵng, Cần Thơ, Hải Phòng) |
| **Giai đoạn** | Pre-seed / MVP (Phase 1) |
| **Mô hình doanh thu** | Freemium (Premium 79.000đ/tháng) + B2B PT Portal |
| **Ngày cập nhật** | 11/06/2026 |

---

## 1. Vấn đề (Problem statement)

Cộng đồng tập gym và quan tâm sức khỏe tại Việt Nam đang tăng trưởng mạnh, nhưng **mọi ứng dụng phổ biến trên thị trường đều được thiết kế cho người dùng phương Tây**, để lại một khoảng trống lớn cho người Việt.

### 1.1. Bối cảnh thị trường (dữ kiện định cỡ)

| Chỉ số | Ước lượng | Ý nghĩa |
|---|---|---|
| Dân số VN | ~100 triệu | Cơ sở thị trường lớn |
| Tỉ lệ dùng smartphone (đô thị) | >85% | Nền tảng cho mobile-first / PWA |
| Số phòng gym & studio cả nước | ~10.000+ cơ sở | Kênh phân phối B2B và partnership |
| Hội viên gym đang hoạt động (ước tính) | 2,5–4 triệu người | TAM trực tiếp cho app fitness |
| Người quan tâm "ăn sạch / giảm cân / tăng cơ" (không tới phòng gym) | 8–12 triệu người | SAM mở rộng |
| Tăng trưởng ngành fitness VN/năm | ~10–15% | Thị trường đang lên, chưa bão hòa |
| Độ tuổi cốt lõi | 18–35 | Thế hệ "digital-native", quen trả phí app nội địa |

> *Các con số trên là ước lượng định hướng (order-of-magnitude) phục vụ định cỡ cơ hội, sẽ được hiệu chỉnh bằng số liệu sơ cấp trong quá trình thử nghiệm.*

### 1.2. Sáu nỗi đau cụ thể của người Việt tập gym

| # | Vấn đề | Chi tiết thực tế |
|---|---|---|
| 1 | **Database món ăn không có món Việt** | MyFitnessPal & cộng sự đầy món Tây. Người Việt log **phở bò**, **cơm tấm sườn bì chả**, **bún bò Huế**, **bánh mì thịt**, **bún chả**, **xôi mặn**, **cháo lòng**, **gỏi cuốn**, **chè**... đều phải tự chế entry hoặc ghép tạm "rice + beef" → số liệu calo/macro **sai lệch nghiêm trọng** và tốn công. |
| 2 | **Đơn vị đo lường lệch** | Người Việt nghĩ theo **bát/chén cơm, tô phở, ổ bánh mì, ly, dĩa, muỗng**, không phải "1 cup" hay "1 oz". App nước ngoài bắt quy đổi thủ công, gây nản. |
| 3 | **Rào cản tiếng Anh** | Giao diện, hướng dẫn bài tập, mô tả dinh dưỡng đều bằng tiếng Anh. Phần lớn người mới tập (và người lớn tuổi) **không đủ tự tin đọc hiểu thuật ngữ** ("deficit", "macros", "RPE", "progressive overload"). |
| 4 | **App rời rạc giữa tập & ăn** | Người dùng phải dùng **Strong/Hevy để log tạ** + **MyFitnessPal để log ăn** + **Google Sheets để theo dõi cân nặng**. Dữ liệu phân mảnh, không có bức tranh tổng thể, không ai chịu duy trì 3 app. |
| 5 | **Không có HLV / coaching cá nhân hoá** | App chỉ là sổ ghi chép thụ động. Người mới **không biết tập gì, ăn bao nhiêu, vì sao chững cân**. Thuê PT 1-1 tốn **3–8 triệu đồng/tháng** — ngoài tầm với của số đông. |
| 6 | **Giá đắt, niêm yết theo USD** | MyFitnessPal Premium ~**$19,99/tháng (~500.000đ)**; nhiều app tính phí USD qua thẻ quốc tế. Với mức chi tiêu app nội địa, đây là rào cản tâm lý và thực tế rất lớn. |

**Tóm lại:** Người Việt đang phải "gồng" để dùng công cụ không dành cho mình — dữ liệu sai, tốn 2–3 app, đọc tiếng Anh, không ai hướng dẫn, và trả giá cao. FitVN xoá bỏ toàn bộ ma sát đó.

---

## 2. Giải pháp (Solution)

**FitVN là một PWA mobile-first gói trọn việc tập luyện + dinh dưỡng + huấn luyện AI trong một ứng dụng, bản địa hoá hoàn toàn cho người Việt.**

### 2.1. Bốn trụ cột giải pháp

| Trụ cột | FitVN làm gì | Vì sao quan trọng |
|---|---|---|
| **PWA mobile-first** | Cài thẳng từ trình duyệt (Add to Home Screen), chạy **offline** (log tạ trong phòng gym sóng yếu vẫn được), **push notification** nhắc lịch — **không cần qua App Store/CH Play**. | Cài đặt 1 chạm, không mất 30% phí store, cập nhật tức thì, dung lượng nhẹ, hoạt động trên cả Android tầm trung. |
| **Database thực phẩm Việt** | Thư viện món Việt thật: **phở, cơm tấm, bún bò, bánh mì, bún chả, xôi, chè...** với khẩu phần theo **bát/tô/dĩa/ly**, calo & macro chuẩn hoá. | Log ăn nhanh, đúng, không phải tự chế entry. Đây là **"con hào"** khó sao chép nhất. |
| **AI Coach tiếng Việt** | Trợ lý dựa trên Claude, **nói tiếng Việt tự nhiên**, hiểu ngữ cảnh người dùng (mục tiêu, lịch sử tập, nhật ký ăn) để gợi ý giáo án, giải thích "vì sao chững cân", chấn chỉnh khẩu phần — như có PT trong túi. | Dân chủ hoá coaching từ 3–8 triệu/tháng xuống mức freemium/79k. Khác biệt cốt lõi. |
| **All-in-one (tập + ăn)** | Log buổi tập **và** nhật ký dinh dưỡng **và** cân nặng/số đo trong **một app**, dữ liệu liên thông để AI Coach phân tích toàn cảnh. | Một app duy nhất cần duy trì → giữ chân tốt hơn, dữ liệu giàu hơn cho AI. |

### 2.2. Vì sao PWA (không phải app native)?

- **Phân phối không ma sát:** chia sẻ link là dùng được ngay — hợp với kênh viral TikTok/Facebook.
- **Không bị "thuế App Store/CH Play" 15–30%** trên doanh thu Premium.
- **Một codebase** (Next.js) cho web + mobile → tốc độ ra tính năng nhanh, chi phí kỹ thuật thấp.
- **Offline-first** với service worker: thao tác log vẫn mượt trong phòng gym sóng kém, đồng bộ khi có mạng.

---

## 3. Chân dung người dùng (Personas)

### Persona A — Người mới tập: **Minh, 24 tuổi**

| Thuộc tính | Chi tiết |
|---|---|
| **Nghề nghiệp** | Nhân viên văn phòng (IT/marketing), TP.HCM, thu nhập 12–18 triệu/tháng |
| **Mục tiêu** | Giảm 6kg mỡ bụng, "có dáng" để tự tin, không biết bắt đầu từ đâu |
| **Pain points** | Vào phòng gym không biết tập máy nào; tải MyFitnessPal nhưng bỏ sau 4 ngày vì không tìm thấy "cơm tấm", tiếng Anh khó; sợ tập sai chấn thương; thuê PT thì tiếc tiền |
| **Động lực** | Sắp đám cưới bạn thân / mùa hè / ảnh hồ sơ; muốn kết quả nhanh nhưng cần được "cầm tay chỉ việc" |
| **Ngày điển hình** | Sáng cà phê + bánh mì; trưa cơm văn phòng; tối 19h tới gym 45 phút rồi về ăn tối. Lướt TikTok fitness trên giường trước ngủ. |
| **Vì sao FitVN hợp** | AI Coach tiếng Việt soạn giáo án người-mới + giải thích từng bài; log "bánh mì thịt" / "cơm tấm" trong 5 giây; thư viện bài tập có video & hướng dẫn tiếng Việt; nhắc lịch push lúc 18h30. |

> *"Cuối cùng cũng có app nói chuyện với mình bằng tiếng Việt và biết cơm tấm bao nhiêu calo."*

### Persona B — Người tập lâu năm: **Tuấn, 30 tuổi**

| Thuộc tính | Chi tiết |
|---|---|
| **Nghề nghiệp** | Kỹ sư / chủ shop online, Hà Nội, thu nhập 25–40 triệu/tháng |
| **Mục tiêu** | Tăng cơ giai đoạn bulking sạch, đẩy PR (squat/deadlift/bench), kiểm soát macro chặt |
| **Pain points** | Đang xài **Strong** để log tạ + **MyFitnessPal** để log macro + **sheet** để theo dõi PR → mệt mỏi vì 3 nơi; log món Việt vẫn sai macro; không có ai phân tích progressive overload giúp |
| **Động lực** | Tự hào về thành tích, thích dữ liệu & biểu đồ tiến bộ, sẵn sàng trả phí cho công cụ tốt |
| **Ngày điển hình** | Meal-prep cuối tuần; ăn 4–5 bữa theo macro; tập 5 buổi/tuần theo lịch push/pull/legs; chụp số đo & cân nặng định kỳ. |
| **Vì sao FitVN hợp** | Gộp tập + ăn + số đo vào một app, AI Coach phân tích **xu hướng tải trọng & calo** để gợi ý tăng tạ/điều chỉnh ăn; food DB Việt cho phép bulking bằng món quen (phở, cơm) mà vẫn đúng macro; xuất biểu đồ tiến bộ. |

> *"Tôi muốn một app duy nhất nhìn được cả tạ lẫn macro và nói cho tôi biết tuần này nên đẩy tạ hay nghỉ."*

---

## 4. Tính năng cốt lõi — Phase 1 (MVP)

| Tính năng | Mô tả | Giá trị mang lại |
|---|---|---|
| **Log buổi tập** | Ghi nhanh bài tập, set × reps × tạ, thời gian nghỉ; lưu lịch sử & tự gợi ý lần trước đã đẩy bao nhiêu. | Thay thế Strong/Hevy; theo dõi progressive overload; hoạt động **offline** trong phòng gym. |
| **Thư viện bài tập VN** | Danh mục bài tập theo nhóm cơ, có **mô tả & hướng dẫn tiếng Việt** (kèm hình/video), phân loại theo trình độ & dụng cụ. | Người mới biết tập gì & tập đúng; giảm rào cản tiếng Anh và nguy cơ chấn thương. |
| **Nhật ký dinh dưỡng + Food DB Việt** | Tìm & log món Việt theo **bát/tô/dĩa/ly**; tự cộng calo, protein, carb, fat theo ngày; mục tiêu macro cá nhân. | Log ăn **nhanh & chính xác** với món quen thuộc — lợi thế khác biệt cốt lõi. |
| **Theo dõi cân nặng & số đo** | Nhập cân nặng, vòng eo/ngực/tay/đùi, % mỡ; biểu đồ xu hướng theo thời gian. | Nhìn thấy tiến bộ → tạo động lực duy trì (retention). |
| **AI Coach (tiếng Việt)** | Chat bằng tiếng Việt; dựa trên dữ liệu cá nhân để gợi ý giáo án, giải thích chững cân, điều chỉnh khẩu phần, trả lời thắc mắc tập–ăn. | "PT trong túi" với giá rẻ; tăng kích hoạt & giữ chân; điểm bán hàng mạnh nhất. |
| **PWA: Offline + Push** | Cài như app, dùng offline, **push nhắc lịch tập/uống nước/log bữa ăn**. | Không cần App Store; giữ thói quen bằng nhắc nhở đúng lúc → retention. |

**Phạm vi MVP có chủ đích:** tập trung vào 6 tính năng trên cho vòng tập–ăn–coach. Các tính năng cộng đồng/social, tích hợp thiết bị đeo (wearables), và marketplace giáo án **để dành Phase 2+** (xem Lộ trình).

---

## 5. Điểm khác biệt vs MyFitnessPal & Strong

| Tiêu chí | **FitVN** | MyFitnessPal | Strong / Hevy |
|---|---|---|---|
| **Database món Việt (phở, cơm tấm, bún bò...)** | ✅ Bản địa hoá sâu, theo bát/tô/dĩa | ⚠️ Crowd-sourced lộn xộn, thiếu món Việt chuẩn | ❌ Không có module dinh dưỡng |
| **Giao diện & nội dung tiếng Việt** | ✅ 100% tiếng Việt, thuật ngữ dễ hiểu | ❌ Chủ yếu tiếng Anh | ❌ Tiếng Anh |
| **AI Coaching cá nhân hoá** | ✅ AI Coach tiếng Việt hiểu ngữ cảnh | ❌ Không | ❌ Không |
| **All-in-one (tập + ăn + số đo)** | ✅ Một app | ⚠️ Mạnh về ăn, yếu về log tạ | ⚠️ Mạnh về tạ, không có ăn |
| **Giá nội địa** | ✅ **79.000đ/tháng** | ❌ ~$19,99 (~500k), tính USD | ⚠️ ~$5–10/tháng, tính USD |
| **PWA (cài nhanh, offline, không qua store)** | ✅ Cài 1 chạm, offline-first | ❌ App native, qua store | ❌ App native, qua store |
| **Đơn vị đo địa phương** | ✅ bát/tô/dĩa/ly/ổ | ❌ cup/oz/lb | — |

**Định vị một câu:** *"MyFitnessPal + Strong + một PT cá nhân — nhưng nói tiếng Việt, biết món Việt, và với giá Việt."*

---

## 6. Mô hình kinh doanh (Business model)

### 6.1. Freemium: Free vs Premium

| Tính năng | **Free** | **Premium — 79.000đ/tháng** |
|---|---|---|
| Log buổi tập (không giới hạn) | ✅ | ✅ |
| Thư viện bài tập VN | ✅ (cơ bản) | ✅ (đầy đủ + video chi tiết) |
| Nhật ký dinh dưỡng + Food DB Việt | ✅ (giới hạn lượt tìm/ngày) | ✅ (không giới hạn) |
| Theo dõi cân nặng & số đo | ✅ (biểu đồ cơ bản) | ✅ (biểu đồ nâng cao, xuất dữ liệu) |
| **AI Coach** | ⚠️ Giới hạn (vd ~5 tin nhắn/ngày) | ✅ **Không giới hạn** + giáo án & meal plan cá nhân hoá |
| Tạo giáo án/meal plan tự động bằng AI | ❌ | ✅ |
| Quảng cáo | Có (nhẹ) | Không |
| Nhắc lịch push thông minh | ✅ | ✅ (tuỳ chỉnh sâu) |

**Gói năm (gợi ý):** 790.000đ/năm (~2 tháng miễn phí) để tăng LTV & giảm churn.

### 6.2. Unit economics ước lượng (Premium / user / tháng)

| Khoản mục | Ước lượng | Ghi chú |
|---|---|---|
| Doanh thu/user (ARPU Premium) | **79.000đ** | Sau phí cổng thanh toán nội địa (~1–3%): ~76.000–78.000đ ròng |
| **Chi phí Claude API/user** | **~10.000–20.000đ** | Giả định ~150–300 lượt chat/tháng cho user Premium, tối ưu bằng **prompt caching** + định tuyến model (Haiku cho tác vụ nhẹ, Sonnet/Opus cho coaching sâu) |
| Hạ tầng (Supabase, Vercel, push) phân bổ/user | ~3.000–6.000đ | Giảm dần theo quy mô (kinh tế nhờ quy mô) |
| **COGS biến đổi/user** | **~15.000–26.000đ** | |
| **Gross margin (ước lượng)** | **~65–80%** | Khoẻ mạnh cho mô hình SaaS; cải thiện khi tối ưu cache & batch |

> **Đòn bẩy chi phí AI:** prompt caching (cache profile + lịch sử người dùng), tóm tắt ngữ cảnh thay vì gửi full lịch sử, định tuyến model theo độ phức tạp, và hàng đợi cho tác vụ không real-time. Đây là yếu tố sống còn để giữ margin khi mở rộng.

### 6.3. B2B — PT Portal

Cổng dành cho **Huấn luyện viên cá nhân (PT)** và **phòng gym** quản lý học viên trên nền tảng FitVN.

| Năng lực | Mô tả |
|---|---|
| Quản lý học viên | Dashboard danh sách học viên, theo dõi tiến độ tập/ăn/cân nặng theo thời gian thực |
| Kê giáo án | Giao bài tập theo tuần/buổi cho từng học viên, theo dõi mức hoàn thành |
| Kê dinh dưỡng | Lập meal plan dựa trên Food DB Việt, đặt mục tiêu macro cho học viên |
| Trao đổi & nhắc nhở | Nhắn tin, nhắc lịch, ghi chú tiến bộ |
| **White-label (tiềm năng)** | Phòng gym/chuỗi gắn thương hiệu riêng lên app cho hội viên — gói nâng cao Phase 2+ |

**Pricing gợi ý (B2B):**

| Gói | Giá gợi ý | Đối tượng |
|---|---|---|
| PT Solo | ~199.000đ/tháng (tối đa ~15–20 học viên) | PT tự do |
| PT Pro | ~499.000đ/tháng (tối đa ~50 học viên) | PT toàn thời gian / studio nhỏ |
| Gym/Chuỗi (white-label) | Báo giá theo quy mô (từ ~2–5 triệu/tháng) | Phòng gym, chuỗi fitness |

> **Vì sao B2B mạnh:** PT đem theo học viên → kênh acquisition chi phí thấp; B2B có ARPU cao, churn thấp, và là cầu nối tự nhiên cho người dùng Free → Premium (học viên của PT tiếp tục dùng sau khi hết hợp đồng).

---

## 7. Go-to-market (GTM)

Chiến lược **community-led + content-led**, tận dụng đặc thị trường VN nơi quyết định mua chịu ảnh hưởng nặng từ cộng đồng và KOL.

### 7.1. Kênh chính

| Kênh | Chiến thuật cụ thể |
|---|---|
| **Cộng đồng gym & phòng tập** | Đặt standee/QR tại quầy lễ tân các phòng gym đối tác; tài trợ thử thách "30 ngày" tại phòng; PT giới thiệu cho học viên. |
| **Facebook Groups** | Thâm nhập các nhóm thực tế: **"Hội những người tập Gym Việt Nam"**, **"Gymer Việt Nam"**, **"Ăn sạch – Eat Clean"**, **"Hội giảm cân khoa học"**, nhóm gym theo địa phương. Đăng **review thật, UGC** (ảnh nhật ký món Việt, before-after), trả lời chân thành câu hỏi "phở bao nhiêu calo". |
| **TikTok** | Trục content chính: video fitness **tiếng Việt** — mẹo dinh dưỡng **món Việt** ("Ăn cơm tấm sao cho đủ protein"), **before-after** học viên, demo AI Coach trả lời tiếng Việt, "đếm calo bữa ăn Việt trong 5 giây". Hợp tác **KOL fitness & PT** có sẵn audience. |
| **Referral** | Mời bạn → cả hai nhận thêm ngày Premium; PT mời học viên → thưởng. Tận dụng tính chia sẻ link dễ của PWA. |
| **Partnership phòng gym** | Gói B2B PT Portal làm đòn bẩy: phòng gym dùng FitVN quản lý hội viên → hội viên dùng app → Free→Premium funnel. |

### 7.2. Phễu AARRR (tóm tắt)

| Giai đoạn | Chiến thuật | Mục tiêu đo |
|---|---|---|
| **Acquisition** | TikTok/Facebook content, QR tại gym, KOL/PT | Lượt cài (Add to Home Screen), CAC |
| **Activation** | Onboarding tiếng Việt, log món Việt đầu tiên + chat AI Coach trong phiên đầu | % hoàn thành onboarding + có "aha moment" trong 24h |
| **Retention** | Push nhắc lịch, biểu đồ tiến bộ, AI Coach chủ động | D1/D7/D30 retention |
| **Revenue** | Free→Premium (giới hạn AI Coach), gói năm, B2B PT Portal | Tỉ lệ chuyển đổi Premium, ARPU, MRR |
| **Referral** | Mời bạn nhận Premium, PT mời học viên | Hệ số viral (k-factor) |

### 7.3. Ba chỉ số Bắc Đẩu (North Star) đề xuất

1. **Số người dùng hoạt động hằng tuần có ≥3 lần log (tập hoặc ăn)/tuần (WAU₃₊)** — đo thói quen thật sự, dự báo retention & sẵn sàng trả phí.
2. **Số tương tác AI Coach có ý nghĩa/người dùng hoạt động/tuần** — đo mức độ giá trị cốt lõi (coaching) được tiêu thụ; tương quan với chuyển đổi Premium.
3. **MRR kết hợp (Premium B2C + B2B PT Portal)** — đo sức khoẻ kinh doanh tổng thể.

---

## 8. Rủi ro & giảm thiểu

| Rủi ro | Mức độ | Giảm thiểu |
|---|---|---|
| **Chi phí Claude API vượt margin khi scale** | Cao | Prompt caching, tóm tắt ngữ cảnh, định tuyến model theo độ phức tạp, giới hạn lượt ở Free tier, batch tác vụ không real-time. |
| **Xây & duy trì Food DB Việt tốn công, dễ sai số liệu** | Cao | Bắt đầu với ~300–500 món phổ biến do chuyên gia dinh dưỡng kiểm; bổ sung dần; cho user đề xuất món (có duyệt) để mở rộng có kiểm soát. |
| **Sẵn lòng trả phí app nội địa còn thấp** | Trung bình | Free tier giá trị thật để tạo thói quen; giá 79k "cà phê 2 ly"; gói năm; đòn bẩy B2B (PT bán giúp). |
| **MyFitnessPal/đối thủ lớn bản địa hoá VN** | Trung bình | Tốc độ + chiều sâu bản địa (đơn vị bát/tô, AI tiếng Việt, cộng đồng) làm con hào; ưu tiên ra mắt nhanh, chiếm cộng đồng & PT trước. |
| **AI Coach đưa lời khuyên sai/không an toàn** | Trung bình–Cao | Guardrails nội dung, disclaimer y tế rõ ràng, không chẩn đoán/kê đơn, khuyến nghị gặp bác sĩ với trường hợp đặc biệt; kiểm thử prompt thường xuyên. |
| **Quyền riêng tư dữ liệu sức khoẻ** | Trung bình | RLS chặt trên Supabase, không bán dữ liệu, minh bạch chính sách, tuân thủ quy định bảo vệ dữ liệu cá nhân VN. |
| **Hạn chế PWA trên iOS (push, install UX)** | Thấp–Trung bình | Bám tính năng PWA mới nhất iOS hỗ trợ; hướng dẫn cài rõ ràng; cân nhắc wrapper native nhẹ ở Phase 2 nếu cần push iOS mạnh hơn. |

---

## 9. Lộ trình 0–12 tháng (tóm tắt)

| Mốc | Trọng tâm |
|---|---|
| **Tháng 0–3 — MVP & Soft launch** | Hoàn thiện 6 tính năng Phase 1; Food DB Việt ~300–500 món; AI Coach v1; PWA offline + push. Soft launch nhóm closed beta (1–2 phòng gym đối tác + cộng đồng nhỏ). |
| **Tháng 3–6 — Public launch & GTM** | Mở công khai; đẩy content TikTok/Facebook + KOL/PT; ra mắt Premium 79k; tối ưu funnel Activation→Retention; bắt đầu thu phí. |
| **Tháng 6–9 — B2B PT Portal** | Ra mắt PT Portal (PT Solo/Pro); ký 10–30 PT/phòng gym đầu tiên; mở rộng Food DB & thư viện bài tập; cải tiến AI Coach v2. |
| **Tháng 9–12 — Scale & con hào** | Tối ưu unit economics AI; tính năng cộng đồng/social nhẹ; thử nghiệm white-label cho chuỗi gym; chuẩn bị gọi vốn seed dựa trên traction (WAU₃₊, MRR, k-factor). |

---

### Phụ lục — Biến môi trường tham chiếu (do agent khác sở hữu `.env.example`)

Các biến dự kiến mã sử dụng (chỉ tham chiếu, **không** hardcode):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — tác vụ server-side đặc quyền
- `ANTHROPIC_API_KEY` — Claude API cho AI Coach (qua Vercel AI SDK)

> *Tài liệu này là Product Brief định hướng. Các con số tài chính/thị trường là ước lượng phục vụ ra quyết định và sẽ được hiệu chỉnh bằng dữ liệu thực nghiệm trong giai đoạn beta.*
