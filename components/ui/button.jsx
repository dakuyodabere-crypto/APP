import PropTypes from "prop-types";

export function Button({ className = "", variant, ...props }) {
  const variantClasses = {
    outline: "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${variantClasses[variant] || ""} ${className}`}
      {...props}
    />
  );
}

Button.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.string,
};
