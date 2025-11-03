import React, { useRef, useState, useEffect } from "react";

function App() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 20;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const canvas = canvasRef.current;
      const base64Image = canvas.toDataURL("image/png").split(",")[1];

      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(
          `Predicted Digit: ${data.digit} (Confidence: ${(
            data.confidence * 100
          ).toFixed(1)}%)`
        );
      } else {
        setResult("Error: " + (data.error || "Prediction failed"));
      }
    } catch (error) {
      setResult("Error: Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setResult("");
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        minWidth: "100vw",
        backgroundColor: "#f5f5f5",
      }}
    >
      <div
        style={{
          textAlign: "center",
          fontFamily: "Arial, sans-serif",
          padding: "40px",
          backgroundColor: "white",
          borderRadius: "10px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          // maxWidth: '400px'
        }}
      >
        <h1 style={{ color: "#333", marginBottom: "20px" }}>
          Handwritten Digit Recognizer
        </h1>

        <div
          style={{
            border: "3px solid #333",
            display: "inline-block",
            marginBottom: "20px",
            cursor: "crosshair",
          }}
        >
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={handlePredict}
            disabled={loading}
            style={{
              padding: "10px 30px",
              fontSize: "16px",
              marginRight: "10px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Predicting..." : "Predict"}
          </button>

          <button
            onClick={handleClear}
            style={{
              padding: "10px 30px",
              fontSize: "16px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>

        {result && (
          <div
            style={{
              padding: "15px",
              backgroundColor: "#e8f5e9",
              borderRadius: "4px",
              fontSize: "18px",
              fontWeight: "bold",
              color: "#2e7d32",
            }}
          >
            {result}
          </div>
        )}

        <p
          style={{
            marginTop: "20px",
            color: "#666",
            fontSize: "14px",
          }}
        >
          Draw a digit (0-9) in the box above
        </p>
      </div>
    </div>
  );
}

export default App;
