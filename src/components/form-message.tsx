type FormMessageProps = {
  type: "success" | "error" | "warning";
  message: string;
};

const styles = {
  success: {
    backgroundColor: "#ecfdf3",
    border: "1px solid #a6f4c5",
    color: "#067647",
  },
  error: {
    backgroundColor: "#fef3f2",
    border: "1px solid #fda29b",
    color: "#b42318",
  },
  warning: {
    backgroundColor: "#fffaeb",
    border: "1px solid #fedf89",
    color: "#b54708",
  },
};

export default function FormMessage({ type, message }: FormMessageProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        ...styles[type],
        padding: "12px 14px",
        borderRadius: "8px",
        marginBottom: "16px",
      }}
    >
      {message}
    </div>
  );
}