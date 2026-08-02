import PropTypes from "prop-types";

export function Label({ className = "", children, ...props }) {
  return (
    <label className={`block text-sm font-medium text-zinc-700 ${className}`} {...props}>
      {children}
    </label>
  );
}

Label.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};
