import { Card } from "react-bootstrap";
import optimizeImageUrl from "../utils/optimizeImageUrl";

const MenuItemCard = ({ item }) => {
  return (
    <Card className="h-100 shadow-sm">
      {item.image && (
        <Card.Img
          variant="top"
          src={optimizeImageUrl(item.image)}
          alt={item.name}
          style={{ height: "200px", objectFit: "cover" }}
        />
      )}
      <Card.Body className="d-flex flex-column">
        <Card.Title>{item.name}</Card.Title>
        <Card.Text className="text-muted small mb-2">
          {item.category}
        </Card.Text>
        <Card.Text className="flex-grow-1">
          {item.description}
        </Card.Text>
        <div className="mt-auto">
          <Card.Text className="h5 text-primary mb-0">
            ${item.price.toFixed(2)}
          </Card.Text>
        </div>
      </Card.Body>
    </Card>
  );
};

export default MenuItemCard;
