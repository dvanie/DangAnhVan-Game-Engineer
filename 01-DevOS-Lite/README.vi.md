# DevOS

*[English](README.md) · Tiếng Việt · [Portfolio](../README.vi.md)*

**Công cụ phát triển · CLI Node.js · v0.6.1**

Mình xây DevOS trong quá trình làm *The Wone: Shadows* để dễ tìm cấu trúc dự án, phụ thuộc và luật triển khai trước khi sửa gameplay.

## Cách hoạt động

- **Gắn vào dự án.** Runtime cài bên ngoài dự án. Thư mục `.DevOS` lưu cấu hình dành riêng cho dự án và dữ liệu đã biên dịch.
- **Biên dịch.** DevOS tìm tài nguyên, xác định tính năng nào sở hữu chúng, rồi dựng thông tin phụ thuộc và kiến trúc. Kết quả được gom theo tính năng, kèm file, contract và rủi ro liên quan.
- **Tra cứu.** `ask` xếp hạng tính năng liên quan đến yêu cầu, `impact` chỉ ra các phần có thể bị ảnh hưởng, còn `adapter` xuất phần ngữ cảnh vừa đủ cho coding agent. Các lệnh tra cứu dựa trên dữ liệu đã biên dịch và cho kết quả theo quy tắc xác định.

Ví dụ từ một dự án Unity đã khởi tạo:

```bash
devos compile --all
devos ask "summon flow" --budget small
devos impact "change how Shadow targets are selected"
```

## Mã nguồn và kiểm thử

Runtime hiện tại, hướng dẫn và bộ kiểm thử đều công khai. Bộ kiểm thử tạo dự án tạm để kiểm tra khởi tạo, quyền sở hữu tài nguyên, biên dịch, đóng gói CLI và quy trình làm việc.

[Mã nguồn DevOS hiện tại](https://github.com/Heavant/DevOS) · [Hướng dẫn sử dụng](https://github.com/Heavant/DevOS/blob/main/docs/DEVOS_PRODUCT_GUIDE.md) · [Bộ kiểm thử](https://github.com/Heavant/DevOS/tree/main/tests)

Thư mục này giữ mẫu **DevOS-Lite** và [ghi chú quy trình ban đầu](docs/agent-workflow.md). [Demo CLI giai đoạn đầu](../docs/DevOS-Demo.gif)
