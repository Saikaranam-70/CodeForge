import React from "react";
import { Link } from "react-router-dom";
import { Code2, ArrowLeft } from "lucide-react";

const NotFoundPage = () => {
  return (
    <div className="container py-5 text-center d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "70vh" }}>
      <div className="clay-card p-5" style={{ maxWidth: "500px" }}>
        <h1 className="fw-bold display-1 text-primary mb-2">404</h1>
        <h4 className="fw-bold mb-3">Page Not Found</h4>
        <p className="text-muted mb-4">
          The problem or room you are looking for does not exist or may have been moved.
        </p>
        <Link to="/problems" className="clay-btn clay-btn-primary py-2 px-4">
          <ArrowLeft size={16} />
          <span>Back to Arena</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
