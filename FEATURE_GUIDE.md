# 🎯 Hướng dẫn sử dụng các tính năng mới trong SimpleNoteForm

## ✨ Tổng quan

SimpleNoteForm đã được nâng cấp với 2 chức năng chính:
- 🏷️ **Add Tags**: Quản lý và thêm thẻ cho ghi chú
- 📤 **Upload Image**: Tải ảnh từ máy tính

---

## 🏷️ Add Tags (Thêm thẻ)

### Cách sử dụng:
1. Nhấn nút **"Thêm thẻ"** (biểu tượng Tag)
2. Modal sẽ mở ra với 2 phần:
   - **Quản lý thẻ**: Tạo, chỉnh sửa, xóa thẻ
   - **Chọn thẻ**: Chọn thẻ cho ghi chú hiện tại

### Tính năng:
- ✅ Tạo thẻ mới với tên và màu tùy chỉnh
- ✅ Chỉnh sửa thẻ đã tồn tại
- ✅ Xóa thẻ (với xác nhận)
- ✅ 12 màu preset có sẵn
- ✅ Preview thẻ đã chọn dưới dạng badges
- ✅ Có thể xóa thẻ khỏi ghi chú bằng nút X

---

## 📤 Upload Image (Tải ảnh lên)

### Cách sử dụng:
1. Nhấn nút **"Tải ảnh"** (biểu tượng Upload)
2. Chọn file ảnh từ máy tính
3. Ảnh sẽ được tải lên tự động

### Tính năng:
- ✅ Hỗ trợ các định dạng: PNG, JPG, JPEG, GIF, WEBP
- ✅ Loading state khi upload
- ✅ Preview ảnh đã tải với số thứ tự
- ✅ Có thể xóa ảnh đã chọn
- ✅ Tự động lưu vào Convex storage

---

## 🎨 UI/UX Improvements

### Shadcn/UI Design:
- ✅ Consistent button styles với hover effects
- ✅ Màu sắc phân biệt cho từng chức năng:
  - 🔵 Tags: Blue theme
  - 🟢 Upload: Green theme

### Responsive Design:
- ✅ Mobile-friendly modals
- ✅ Touch-friendly button sizes
- ✅ Proper spacing và layout
- ✅ Loading states và feedback

### Accessibility:
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ High contrast colors
- ✅ Clear error messages

---

## 🔧 Technical Details

### State Management:
- `selectedTags`: Mảng ID các thẻ đã chọn
- `uploadedImages`: Mảng ID các ảnh đã tải lên
- `showTagManager`: Boolean hiển thị modal tag manager
- `isUploading`: Boolean trạng thái upload

### API Integration:
- `api.tags.list`: Lấy danh sách thẻ
- `api.images.generateUploadUrl`: Tạo URL upload
- `api.images.create`: Tạo record ảnh
- `api.notes.create`: Tạo ghi chú với tags và images

### File Structure:
```
src/
├── components/
│   ├── SimpleNoteForm.tsx (main component)
│   ├── TagManager.tsx (tag management)
│   └── ui/button.tsx (shadcn button)
├── types/
│   └── google.d.ts (Google API types)
└── lib/
    └── utils.ts (utility functions)
```

---

## 📝 Usage Example

```typescript
// Tạo ghi chú với tags và images
await createNote({
  title: content.trim(),
  content: content.trim(),
  tags: selectedTags,      // Array of tag IDs
  imageIds: uploadedImages // Array of image storage IDs
});
```

---

## 🐛 Gỡ lỗi (Troubleshooting)

### Upload lỗi:
- Kiểm tra file size và format
- Verify Convex backend đang chạy
- Check network connection

---

## 🚀 Future Enhancements

- [ ] Bulk image upload
- [ ] Image compression options
- [ ] Drag & drop interface
- [ ] Image editing tools