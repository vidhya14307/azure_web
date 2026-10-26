import { useEffect, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000/api/latest";

// ASCII to String conversion function
function asciiToString(values) {
  if (typeof values === "string") {
    values = values.split(",").map(value => value.trim());
  }

  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Invalid ASCII values");
  }

  const codes = values.map(value => {
    if (
      typeof value !== "number" &&
      typeof value !== "string"
    ) {
      throw new Error("Invalid ASCII value");
    }

    if (typeof value === "string" && value.trim() === "") {
      throw new Error("Invalid ASCII value");
    }

    return Number(value);
  });

  if (
    codes.some(
      code =>
        !Number.isInteger(code) ||
        code < 0 ||
        code > 127
    )
  ) {
    throw new Error("ASCII values must be integers from 0 to 127");
  }

  return String.fromCharCode(...codes);
}

export default function AzureWeb() {
  const [message, setMessage] = useState("Waiting for telemetry...");
  const [timestamp, setTimestamp] = useState(null);
  const [status, setStatus] = useState("CONNECTING");
  const [asciiValues, setAsciiValues] = useState("");
  const [convertedString, setConvertedString] = useState("");
  const [studentName] = useState("VIDHYA J M");
  const [rollNumber] = useState("24EIR114");

  useEffect(() => {
    let active = true;

    async function fetchTelemetry() {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Backend request failed");
        }

        const data = await response.json();

        if (active) {
          setMessage(data.message ?? "");
          setTimestamp(data.timestamp ?? null);
          setStatus("CONNECTED");
          
          // Try to extract ASCII values and convert
          try {
            // Check if message contains comma-separated numbers
            const asciiMatch = data.message.match(/\d+(,\s*\d+)*/);
            if (asciiMatch) {
              setAsciiValues(asciiMatch[0]);
              const converted = asciiToString(asciiMatch[0]);
              setConvertedString(converted);
            } else {
              setAsciiValues("");
              setConvertedString("");
            }
          } catch (error) {
            setAsciiValues("");
            setConvertedString("");
          }
        }
      } catch {
        if (active) {
          setStatus("DISCONNECTED");
        }
      }
    }

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const statusColor =
    status === "CONNECTED"
      ? "#6ee7a0"
      : status === "CONNECTING"
      ? "#facc15"
      : "#fb7185";

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header>
          <h1 style={styles.title}>Azure IoT Hub Telemetry Dashboard</h1>
          <p style={styles.subtitle}>
            Live messages from Azure IoT Hub
          </p>
          <div style={styles.studentInfo}>
            <span style={styles.infoLabel}>Student Name:</span>
            <span style={styles.infoValue}>{studentName}</span>
            <span style={styles.infoLabel}>Roll Number:</span>
            <span style={styles.infoValue}>{rollNumber}</span>
          </div>
        </header>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <span style={styles.label}>CONNECTION STATUS</span>
            <span style={{ ...styles.status, color: statusColor }}>
              <span>●</span> {status}
            </span>
          </div>

          <div style={styles.divider} />

          <p style={styles.label}>DECODED MESSAGE</p>

          <pre style={styles.message}>
            {message}
          </pre>

          <div style={styles.divider} />

          <p style={styles.label}>RECEIVED ASCII VALUES</p>
          <pre style={styles.asciiDisplay}>
            {asciiValues || "No ASCII values received"}
          </pre>

          <div style={styles.divider} />

          <p style={styles.label}>CONVERTED STRING</p>
          <pre style={styles.convertedDisplay}>
            {convertedString || "No conversion available"}
          </pre>

          <div style={styles.divider} />

          <div style={styles.footer}>
            <span style={styles.label}>LAST EVENT</span>
            <span style={styles.timestamp}>
              {timestamp
                ? new Date(timestamp).toLocaleString()
                : "No events received"}
            </span>
          </div>
        </section>

        <p style={styles.note}>
          Azure Event Hub → Flask → React
        </p>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    boxSizing: "border-box",
    background: "#050505",
    color: "#f5f5f5",
    fontFamily: "monospace",
    padding: "48px 24px",
  },
  container: {
    width: "100%",
    maxWidth: "900px",
    margin: "0 auto",
  },
  eyebrow: {
    color: "#777",
    fontSize: "12px",
    letterSpacing: "3px",
  },
  title: {
    fontSize: "clamp(28px, 5vw, 44px)",
    fontWeight: 600,
    margin: "18px 0 10px",
  },
  subtitle: {
    color: "#999",
    fontSize: "14px",
  },
  studentInfo: {
    marginTop: "20px",
    padding: "16px",
    background: "#151515",
    border: "1px solid #292929",
    borderRadius: "8px",
    display: "flex",
    flexWrap: "wrap",
    gap: "24px",
  },
  infoLabel: {
    color: "#888",
    fontSize: "12px",
    fontWeight: 600,
  },
  infoValue: {
    color: "#fff",
    fontSize: "14px",
    fontWeight: 500,
  },
  panel: {
    marginTop: "40px",
    padding: "28px",
    background: "#101010",
    border: "1px solid #292929",
    borderRadius: "12px",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  label: {
    color: "#888",
    fontSize: "11px",
    letterSpacing: "1.5px",
  },
  status: {
    fontSize: "12px",
    fontWeight: 600,
  },
  divider: {
    height: "1px",
    background: "#292929",
    margin: "24px 0",
  },
  message: {
    minHeight: "100px",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    color: "#fff",
    fontSize: "clamp(18px, 3vw, 24px)",
    lineHeight: 1.7,
    marginTop: "18px",
    fontFamily: "monospace",
  },
  asciiDisplay: {
    padding: "12px",
    background: "#0a0a0a",
    border: "1px solid #1a1a1a",
    borderRadius: "6px",
    color: "#6ee7a0",
    fontSize: "14px",
    fontFamily: "monospace",
    minHeight: "40px",
  },
  convertedDisplay: {
    padding: "12px",
    background: "#0a0a0a",
    border: "1px solid #1a1a1a",
    borderRadius: "6px",
    color: "#facc15",
    fontSize: "16px",
    fontWeight: 600,
    minHeight: "40px",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
  },
  timestamp: {
    color: "#bbb",
    fontSize: "12px",
  },
  note: {
    textAlign: "center",
    color: "#555",
    fontSize: "11px",
    marginTop: "24px",
  },
};
