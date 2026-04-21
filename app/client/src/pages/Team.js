const teamMembers = [
  {
    name: "Brendan Laus",
    image: "/images/Brendan.jpeg", // put files in public/images/ or swap for an import
    pursuit:
      "Brendan is currently specializing in AI systems with a focus on Machine learning models and general software engineering!",
    contribution:
      "He was in charge of the OPA ruleset formulation and implementation, chat page visual overhaul, a few other other frontend changes and group coordination/communication!",
    bio:
      "Brendan is a fourth year CS major with a specialization in AI systems, with a primary focus on machine learning models (but he's poked around some deep learning). He's hoping to find a career up in Seattle, thanks for popping by!",
    communication:
    "Email: Lausbrendan@gmail.com \n Phone: 503-924-9996 \n Linkedin: Brendan Laus",
  },
  {
    name: "Nicholas Guiley",
    image: "/images/member2.jpg",
    pursuit:
      "Nicholas is about to graduate with a Cybersecurity degree, and he's currently on the path to be working as a database management specialist at Boeing.",
    contribution:
      "Nicholas was in charge of the creation, management, and deployment of the fullstack service. He connected the working frontend to AWS and directed the styling of the site!",
    bio:
      "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores.",
    communication:
      "Email: placeholder@gmail.com \n Phone: number \n Linkedin: linkedin",
  },
  {
    name: "James Nichols",
    image: "/images/member3.jpg",
    pursuit:
      "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam.",
    contribution:
      "James Nichols was the AI specialist for this project, he was in charge of the context creation and implementation of our three AI models!",
    bio:
      "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates.",
      communication:
      "Email: placeholder@gmail.com \n Phone: number \n Linkedin: linkedin",
  },
  {
    name: "Shawn Kitagawa",
    image: "/images/member4.jpg",
    pursuit:
      "Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio.",
    contribution:
      "Shawn was in charge of creating the security framework design!",
    bio:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce non sapien at nulla hendrerit efficitur.",
      communication:
      "Email: placeholder@gmail.com \n Phone: number \n Linkedin: linkedin",
  },
];

function Team() {
  return (
    <div className="team-page">
      <header className="team-header">
        <h1>Meet the Team</h1>
        <p>
          Welcome to the SAACGAIS capstone project! Our project focuses on securing agent-to-agent communication
          in generative AI systems. Below are the members who designed, built,
          and deployed this platform. 
        </p>
      </header>

      <section className="team-grid">
        {teamMembers.map((member) => (
          <article key={member.name} className="team-card">
            <div className="team-photo">
              {member.image ? (
                <img src={member.image} alt={member.name} />
              ) : (
                <div className="team-photo-placeholder">Photo</div>
              )}
            </div>

            <h2 className="team-name">{member.name}</h2>

            <div className="team-section">
              <h3>Current Pursuit</h3>
              <p>{member.pursuit}</p>
            </div>

            <div className="team-section">
              <h3>Role in the Project</h3>
              <p>{member.contribution}</p>
            </div>

            <div className="team-section">
              <h3>About</h3>
              <p>{member.bio}</p>
              </div>

            <div className="team-section">
            <h3>Communcation</h3>
            <p>{member.communication}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Team;