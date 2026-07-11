# DevOS-Lite

*[English](README.md) | Tiếng Việt*

Một CLI nhẹ mình xây để giúp AI coding agent làm việc nhanh và tiết 
kiệm token hơn trên codebase thật — được tạo ra để hỗ trợ quá trình 
phát triển *The Wone: Shadows* (xem `02-TWS-Lite`).

## Demo

![Devos ask command demo](../docs/DevOS-Demo.gif)]


## Vì sao cần

AI agent thường phải quét lại phần lớn codebase để lấy context cho 
mỗi task, tốn rất nhiều token, và dễ đi lệch ra ngoài phạm vi được 
giao. DevOS giải quyết việc này bằng cách biên dịch (compile) toàn bộ 
project thành một lớp "project intelligence" có thể truy vấn — chia 
theo feature, ai/cái gì sở hữu file nào, mức độ rủi ro khi thay đổi — 
để agent chỉ đọc đúng phần cần thiết trước khi bắt tay vào sửa code.

```
Task → DevOS Ask → Feature liên quan + Risk Profile → Sửa đúng phạm vi → Verify → Report
```

## Kết quả đạt được

- Giảm đáng kể lượng source code agent phải đọc cho mỗi task
- Giữ thay đổi đúng phạm vi task, không lan sang hệ thống không liên quan
- Giao được các task nhỏ/vừa cho agent mà không cần review quá kỹ

Quy trình đầy đủ: `docs/agent-workflow.md`

## Về source code

Phần core engine và logic CLI hiện đang để private (gắn liền với một 
dự án đang phát triển thật). Nếu bạn quan tâm, mình rất sẵn lòng show 
trực tiếp source code — liên hệ mình qua [email:danganhvan40@gmail.com].
