import { useEffect, useState } from "react";
import { Container, Row, Col, ButtonGroup, Button } from "react-bootstrap";
import MenuItemCard from "../components/MenuItemCard";

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

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

  const categories = ["All", ...new Set(menuItems.map(item => item.category))];

  const filteredItems =
    selectedCategory === "All"
      ? menuItems
      : menuItems.filter(item => item.category === selectedCategory);

  if (loading) return <p className="text-center">Loading menu...</p>;

  return (
    <Container className="py-4">
      <h2 className="text-center mb-4">Our Menu</h2>

      <div className="d-flex justify-content-center mb-4 flex-wrap gap-2">
        <ButtonGroup>
          {categories.map(category => (
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

      <Row className="g-4 justify-content-center">
        {filteredItems.map(item => (
          <Col key={item._id} xs={12} sm={6} md={4} lg={3}>
            <MenuItemCard item={item} />
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default MenuPage;
