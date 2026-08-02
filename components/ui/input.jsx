import PropTypes from "prop-types";

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#002FA7] focus:ring-2 focus:ring-[#002FA7]/20 ${className}`}
      {...props}
    />
  );
}

Input.propTypes = {
  className: PropTypes.string,
};
