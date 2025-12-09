interface DividerProps {
  text?: string;
}

export function Divider({ text }: DividerProps) {
  return (
    <div className="relative flex items-center my-6">
      <div className="flex-grow border-t border-gray-700"></div>
      {text && (
        <span className="flex-shrink mx-4 text-gray-500 text-sm uppercase tracking-wider">
          {text}
        </span>
      )}
      <div className="flex-grow border-t border-gray-700"></div>
    </div>
  );
}

export default Divider;
