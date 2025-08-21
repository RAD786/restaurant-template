import { Container } from "react-bootstrap";

const Footer = () => {
  return (
    <footer className="bg-dark text-white text-center py-3 mt-5">
      <Container>
        <small>&copy; {new Date().getFullYear()} Your Restaurant Name. All rights reserved.</small>
      </Container>
    </footer>
  );
};

export default Footer;
