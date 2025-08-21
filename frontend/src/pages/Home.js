import { Container, Button, Carousel } from "react-bootstrap";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <>
      {/* Hero Section */}
      <div className="bg-light text-dark py-5">
        <Container className="text-center">
          <h1 className="display-4">Welcome to [Your Restaurant Name]</h1>
          <p className="lead mt-3">
            Fresh ingredients, delicious meals, and fast online ordering.
          </p>
          <Button variant="primary" as={Link} to="/menu" className="mt-3">
            View Menu
          </Button>
        </Container>
      </div>

      {/* Image Carousel */}
      <Container className="mt-5">
        <Carousel>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src="https://source.unsplash.com/800x400/?restaurant,food"
              alt="First slide"
            />
            <Carousel.Caption>
              <h3>Delicious Specials</h3>
              <p>See what we’re cooking up this week.</p>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src="https://source.unsplash.com/800x400/?pizza"
              alt="Second slide"
            />
            <Carousel.Caption>
              <h3>Hot & Fresh</h3>
              <p>Every order made fresh and fast.</p>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src="https://source.unsplash.com/800x400/?burger"
              alt="Third slide"
            />
            <Carousel.Caption>
              <h3>Fan Favorites</h3>
              <p>Try our most popular dishes.</p>
            </Carousel.Caption>
          </Carousel.Item>
        </Carousel>
      </Container>

      {/* Testimonials Section */}
      <div className="py-5 bg-white">
        <h3 className="text-center mb-4">What Our Customers Say</h3>
        <div className="d-flex flex-wrap justify-content-center gap-4 px-3">
          <div className="card p-3 shadow-sm" style={{ maxWidth: "300px" }}>
            <p>"Best food in town, hands down. Always fast and fresh!"</p>
            <small className="text-muted">– Sarah M.</small>
          </div>
          <div className="card p-3 shadow-sm" style={{ maxWidth: "300px" }}>
            <p>"I use their online menu weekly. Easy and delicious!"</p>
            <small className="text-muted">– Jake P.</small>
          </div>
          <div className="card p-3 shadow-sm" style={{ maxWidth: "300px" }}>
            <p>"Love the variety and quality. 10/10 experience."</p>
            <small className="text-muted">– Rachel T.</small>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
