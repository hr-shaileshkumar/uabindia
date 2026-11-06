type PublicStructuredDataProps = {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
};

export default function PublicStructuredData({
  data,
}: PublicStructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
