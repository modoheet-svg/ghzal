import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Login from "./pages/Login"
import Chat from "./pages/Chat"
import Profile from "./pages/Profile"
import Rules from "./pages/Rules"
import Privacy from "./pages/Privacy"
import Contact from "./pages/Contact"
import Admin from "./pages/Admin"
import NotFound from "./pages/NotFound"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/rules" element={<Rules />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
