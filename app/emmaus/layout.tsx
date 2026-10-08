import type {Metadata} from "next";

export const metadata:Metadata={
 title:{absolute:"Emmaus — Walking Through Scripture"},
 description:"Sign in to Emmaus and continue walking through Scripture.",
 applicationName:"Emmaus",
 openGraph:{
  title:"Emmaus — Walking Through Scripture",
  description:"Read carefully. Discover what is there. Continue your walk through Scripture with Emmaus.",
  siteName:"Emmaus",
  type:"website"
 },
 twitter:{
  card:"summary",
  title:"Emmaus — Walking Through Scripture",
  description:"Continue your walk through Scripture with Emmaus."
 },
 robots:{index:true,follow:true},
};

export default function EmmausLayout({children}:{children:React.ReactNode}){return children}
