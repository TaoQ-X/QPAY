import { useLocation, Link } from "react-router-dom";
import Header from "@/components/Header";
import { ArrowLeft } from "lucide-react";

export default function Placeholder() {
  const location = useLocation();
  const pathName = location.pathname === "/" ? "home" : location.pathname.slice(1);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-8rem)]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <div className="inline-block mb-6 px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm font-semibold">
              Work in Progress
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4 capitalize">
              {pathName} Page
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              This page is coming soon. Keep an eye out for updates!
            </p>
            <p className="text-muted-foreground mb-8">
              In the meantime, let us know what you'd like to see on this page by
              reaching out to our team.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all"
            >
              <ArrowLeft size={18} />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
