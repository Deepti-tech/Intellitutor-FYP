import React from 'react'

const Footer = () => {
    return (
        <div style={FooterStyle}>
           <span>© Intellitutor 2023</span>
        </div>
    )
}

const FooterStyle = {
    paddingBottom: '15px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
}

export default Footer