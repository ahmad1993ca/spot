module.exports = (sequelize, DataTypes) => {
    const Profile = sequelize.define("Profile", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      image_url:{
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      about_you: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      profile_visibility:{
        type: DataTypes.STRING,
        allowNull: false,   
      }
    });
  
    return Profile;
  };
  