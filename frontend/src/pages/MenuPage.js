import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  ButtonGroup,
  Button,
  Form,
  InputGroup,
} from "react-bootstrap";
import MenuItemCard from "../components/MenuItemCard";

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/menu");
        const data = await res.json();
        setMenuItems(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch menu:", err);
      }
    };

    fetchMenu();
  }, []);

  const categories = ["All", ...new Set(menuItems.map((item) => item.category))];

  // 🔍 Filter + sort logic
  let filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (sortOption === "priceAsc") {
    filteredItems.sort((a, b) => a.price - b.price);
  } else if (sortOption === "priceDesc") {
    filteredItems.sort((a, b) => b.price - a.price);
  } else if (sortOption === "nameAsc") {
    filteredItems.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortOption === "nameDesc") {
    filteredItems.sort((a, b) => b.name.localeCompare(a.name));
  }

  if (loading) return <p className="text-center">Loading menu...</p>;

  return (
    <Container className="py-4">
      <h2 className="text-center mb-4">Our Menu</h2>

      {/* Filters */}
      <Row className="mb-4 justify-content-center">
        <Col xs={12} md={8}>
          {/* Search Bar */}
          <InputGroup className="mb-3">
            <Form.Control
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>

        <Col xs={12} md="auto" className="mb-2 text-center">
          {/* Sort Dropdown */}
          <Form.Select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="">Sort By</option>
            <option value="priceAsc">Price (Low to High)</option>
            <option value="priceDesc">Price (High to Low)</option>
            <option value="nameAsc">Name (A–Z)</option>
            <option value="nameDesc">Name (Z–A)</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Category Filter */}
      <div className="d-flex justify-content-center mb-4 flex-wrap gap-2">
        <ButtonGroup>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "primary" : "outline-primary"}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </ButtonGroup>
      </div>

      {/* Menu Grid */}
      <Row className="g-4 justify-content-center">
        {filteredItems.map((item) => (
          <Col key={item._id} xs={12} sm={6} md={4} lg={3}>
            <MenuItemCard item={item} />
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default MenuPage;
