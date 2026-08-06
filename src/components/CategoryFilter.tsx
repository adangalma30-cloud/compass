function CategoryFilter() {
  const categories = [
    "All",
    "Restaurant",
    "Café",
    "Bar",
    "Retail",
  ];

  return (
    <div className="categories">
      {categories.map((category) => (
        <button key={category}>{category}</button>
      ))}
    </div>
  );
}

export default CategoryFilter;