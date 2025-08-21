import React, { useRef, useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import emailjs from "@emailjs/browser";

const Contact = () => {
  const formRef = useRef();
  const [submitted, setSubmitted] = useState(false);

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs.sendForm(
      "service_72izisf",
      "template_oqirn6i",
      formRef.current,
      "JjAh1i0Me42Tfqpdm"
    ).then(() => {
      setSubmitted(true);
      formRef.current.reset();
    }).catch((err) => console.error("Email error:", err));
  };

  return (
    <Container className="py-5" style={{ maxWidth: "600px" }}>
      <h2 className="mb-4 text-center">Contact Us</h2>
      {submitted && <Alert variant="success">Message sent successfully!</Alert>}
      <Form ref={formRef} onSubmit={sendEmail}>
        <Form.Group className="mb-3" controlId="formName">
          <Form.Label>Name</Form.Label>
          <Form.Control name="user_name" type="text" required placeholder="Your name" />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control name="user_email" type="email" required placeholder="you@example.com" />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formMessage">
          <Form.Label>Message</Form.Label>
          <Form.Control name="message" as="textarea" rows={4} required placeholder="Your message..." />
        </Form.Group>

        <Button variant="primary" type="submit">Send</Button>
      </Form>
    </Container>
  );
};

export default Contact;
