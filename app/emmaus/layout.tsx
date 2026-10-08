import type {Metadata} from "next";

export const metadata:Metadata={
 title:{absolute:"Emmaus — Walking Through Scripture"},
 description:"Sign in to Emmaus and continue walking through Scripture.",
 applicationName:"Emmaus",
 robots:{index:true,follow:true},
};

export default function EmmausLayout({children}:{children:React.ReactNode}){return children}
