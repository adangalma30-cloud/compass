type BusinessCardProps = {
  name: string;
  rating: number;
  reviews: number;
  city: string;
  tags: string[];
};

function BusinessCard({
  name,
  rating,
  reviews,
  city,
  tags,
}: BusinessCardProps) {
  return (
    <div className="card">
      <h3>{name}</h3>

      <p>
        ⭐ {rating} ({reviews})
      </p>

      <p>📍 {city}</p>

      <div style={{ marginTop: "10px" }}>
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              background: "#eef2ff",
              padding: "5px 10px",
              borderRadius: "15px",
              marginRight: "8px",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default BusinessCard;