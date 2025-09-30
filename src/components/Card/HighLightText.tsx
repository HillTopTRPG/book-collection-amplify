type Props = {
  value: string;
  subStrList?: string[];
  className?: string;
  subClassName?: string;
};

export default function HighLightText({ value, subStrList, className, subClassName }: Props) {
  const subStr = subStrList?.find(s => value.includes(s));
  if (!subStr) return value;

  const sp = value.split(subStr);
  if (sp.length <= 1) {
    if (!className) return value;
    return <span className={className}>{value}</span>;
  }

  return (
    <span className={className}>
      {sp[0]}
      <span className={subClassName}>{subStr}</span>
      {sp[1]}
    </span>
  );
}
