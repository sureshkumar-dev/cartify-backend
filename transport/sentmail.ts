import transporter from "./transporter";
export const sentmail = async(to:string,subject:string,html:string)=>{
    await transporter.sendMail({
    from:`Cartify`,
    to,
    subject,
    html
    })
}