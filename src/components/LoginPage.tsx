import { LoginForm } from "./login-form";

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-2xl">🎨</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
            Chào mừng đến với NoteArt
          </h1>
          <p className="text-base sm:text-lg text-slate-600">
            Đăng nhập để bắt đầu tạo notes
          </p>
        </div>

        <LoginForm />

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Bằng cách đăng nhập, bạn đồng ý với{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 underline">
              Điều khoản sử dụng
            </a>{' '}
            của chúng tôi
          </p>
        </div>
      </div>
    </div>
  );
}