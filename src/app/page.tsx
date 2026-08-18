import { redirect } from "next/navigation";

// The product opens straight into the operation. There is no marketing surface.
export default function Home() {
  redirect("/dashboard");
}
