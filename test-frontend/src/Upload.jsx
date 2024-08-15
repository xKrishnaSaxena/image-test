/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import axios from "axios";

const FileUploadModal = ({ onClose, onUploadFailure }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState({
    Wages: "",
    FederalIncomeTaxWitheld: "",
    SocialSecurityWages: "",
    SocialSecurityTaxWithheld: "",
    MedicareWagesAndTips: "",
    MedicareTaxWithheld: "",
  });

  const handleFailure = () => {
    document.getElementById("popup").innerHTML = "<h2>Upload Failed!</h2>";
    setTimeout(() => {
      onUploadFailure();
      onClose();
    }, 3000);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      setError("File size should be less than 5MB.");
      setSelectedFile(null);
    } else {
      setSelectedFile(file);
      setError("");
    }
  };

  const uploadFile = async () => {
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await axios.post(
        `http://localhost:5000/askAboutImages`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setOutput(response.data);
      setError("");
    } catch (error) {
      console.error(
        "Error:",
        error.response ? error.response.data : error.message
      );
      setError(
        error.response?.data?.error ||
          "Failed to upload and process the file. Please try again."
      );
      handleFailure();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a file.");
      return;
    }
    uploadFile();
  };

  useEffect(() => {
    return () => {};
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "400px",
        zIndex: 1000,
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      }}
    >
      {loading ? (
        <div>
          <div className="loader"></div>
          <p>Fetching Data From the Image...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2>UPLOAD IMAGE</h2>
          <hr />
          <div>
            <input type="file" onChange={handleFileChange} />
            <p style={{ fontSize: "12px", color: "#555" }}>
              Image size should be less than 5MB.
            </p>
            <button
              className="btn"
              onClick={handleSubmit}
              style={{ marginTop: "10px" }}
              disabled={loading}
            >
              Upload
            </button>
          </div>
        </form>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {output.Wages && (
        <div>
          <h3>Response Data:</h3>
          <p>Wages: {output.Wages}</p>
          <p>Federal Income Tax Withheld: {output.FederalIncomeTaxWitheld}</p>
          <p>Social Security Wages: {output.SocialSecurityWages}</p>
          <p>
            Social Security Tax Withheld: {output.SocialSecurityTaxWithheld}
          </p>
          <p>Medicare Wages and Tips: {output.MedicareWagesAndTips}</p>
          <p>Medicare Tax Withheld: {output.MedicareTaxWithheld}</p>
        </div>
      )}
    </div>
  );
};

export default FileUploadModal;
