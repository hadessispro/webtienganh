import { AppHeader } from "../components/AppHeader";
import { AuthStudio } from "../components/AuthStudio";

export default function AuthPage() {
  return (
    <main className="page-shell theme-light app-page">
      <AppHeader active="auth" actionHref="/learn" actionLabel="Phòng học" />
      <AuthStudio />
    </main>
  );
}
