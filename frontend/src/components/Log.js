import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { reset, log } from "../features/user/userSlice";
import { toast } from "react-toastify";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Spinner from "./Spinner";

export default function Log() {
 const [userName, setUserName] = useState(null);
 const { user, isError, isSuccess, isLoading, message} =
  useSelector((state) => state.user);
 const navigate = useNavigate();
 const dispatch = useDispatch();

 useEffect(() => {
  if (isError) {
   toast.error(message);
  }

  if (isSuccess || localStorage.getItem('user')) {
   navigate("/dashboard");
  }

  dispatch(reset());
 }, [user, isError, isSuccess, message]);

 const handleSubmit = () => {
  if (!userName) {
   toast.error("Enter your name!");
  } else {
   dispatch(log(userName));
  }
 };

 if (isLoading) {
  return <Spinner />;
 }

 return (
  <div
   style={{ minHeight: "100vh", minWidth: "100vw" }}
   className="d-flex justify-content-center align-items-center flex-column"
  >
   <Form className="border rounded-1 p-4 text-start"
   style={"background-color: #427fc1"}>
    <Form.Group className="mb-3" controlId="formBasicEmail">
     <Form.Label>Name</Form.Label>
     <Form.Control
      type="text"
      placeholder="Enter name"
      onChange={(e) => {
       setUserName(e.target.value);
      }}
     />
     <Form.Text className="text-muted"></Form.Text>
    </Form.Group>

    <Button
     variant="primary"
     type="button"
     onClick={() => {
      handleSubmit();
     }}
    >
     Sumit
    </Button>
   </Form>
  </div>
 );
}