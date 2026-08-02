import PropTypes from "prop-types";
import { cloneElement, Children } from "react";

export function Dialog({ open, onOpenChange, children }) {
  const trigger = [];
  const content = [];
  const rest = [];

  Children.forEach(children, (child) => {
    if (!child?.type) return;
    const displayName = child.type.displayName;
    if (displayName === "DialogTrigger") trigger.push(child);
    else if (displayName === "DialogContent") content.push(child);
    else rest.push(child);
  });

  return (
    <>
      {trigger.map((child) => cloneElement(child, {
        key: child.key ?? child.type?.displayName ?? "dialog-trigger",
        open,
        onOpenChange,
      }))}
      {content.map((child) => cloneElement(child, {
        key: child.key ?? child.type?.displayName ?? "dialog-content",
        open,
        onOpenChange,
      }))}
      {rest}
    </>
  );
}

Dialog.propTypes = {
  open: PropTypes.bool,
  onOpenChange: PropTypes.func,
  children: PropTypes.node,
};

export function DialogTrigger({ asChild, children, open, onOpenChange }) {
  const child = Children.only(children);
  const handleClick = () => onOpenChange?.(!open);

  if (asChild && typeof child.type !== "string") {
    return cloneElement(child, {
      onClick: handleClick,
    });
  }

  return (
    <button type="button" onClick={handleClick}>
      {children}
    </button>
  );
}
DialogTrigger.displayName = "DialogTrigger";
DialogTrigger.propTypes = {
  asChild: PropTypes.bool,
  children: PropTypes.node.isRequired,
  open: PropTypes.bool,
  onOpenChange: PropTypes.func,
};

export function DialogContent({ open, onOpenChange, children, className = "" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer le dialogue"
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange?.(false)}
      />
      <div className={`relative z-10 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl ${className}`}>
        {children}
      </div>
    </div>
  );
}
DialogContent.displayName = "DialogContent";
DialogContent.propTypes = {
  open: PropTypes.bool,
  onOpenChange: PropTypes.func,
  children: PropTypes.node,
  className: PropTypes.string,
};

export function DialogHeader({ children, className = "" }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}
DialogHeader.displayName = "DialogHeader";
DialogHeader.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

export function DialogTitle({ children, className = "" }) {
  return <h2 className={`text-xl font-semibold text-zinc-900 ${className}`}>{children}</h2>;
}
DialogTitle.displayName = "DialogTitle";
DialogTitle.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

export function DialogFooter({ children, className = "" }) {
  return <div className={`mt-6 flex justify-end gap-2 ${className}`}>{children}</div>;
}
DialogFooter.displayName = "DialogFooter";
DialogFooter.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};
