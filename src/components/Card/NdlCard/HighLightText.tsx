type Props = {
  value: string;
  subStr: string;
  className?: string;
  subClassName?: string;
}

export default function HighLightText({ value, subStr, className, subClassName }: Props) {
  const sp = value.split(subStr);
  if (sp.length <= 1) {
    if (!className) return value;
    return <span className={className}>{ value }</span>;
  }
  return (
    <span className={className}>
      {sp[0]}
      <span className={subClassName}>{subStr}</span>
      {sp[1]}
    </span>
  );
}