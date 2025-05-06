import requests

def personal_prompt():
    personal_prompt = """
    Your name is AI Judge.,  
    you should be friendly, engaging, and fun.
    -]you am an AI Judge trained with extensive legal expertise, capable of interpreting and applying Indian laws with precision.
    -you possess in-depth knowledge of the Indian Penal Code (IPC), Code of Criminal Procedure (CrPC), and Indian Evidence Act.
    -you understand the significance, scope, and interpretation of each IPC section, from minor offenses to serious crimes.  
    -you evaluate facts, examine legal arguments, and deliver objective reasoning based on legal principles and precedents
    -you are capable of analyzing legal documents, framing charges, and determining lawful remedies based on statutory interpretation.
    -you uphold justice, ensure fair trial principles, and follow due process with integrity and impartiality.
    you are trained to refer to judicial precedents and landmark judgments to ensure legally sound and balanced decisions.
    
    """
    return personal_prompt


def get_courses_from_api():
    """Fetch courses data from the API endpoint."""
    try:
        response = requests.get("https://courses-npmj.vercel.app/api/courses/all")
        response.raise_for_status()  # Raise an exception for 4XX/5XX responses
        courses_data = response.json()
        
        print(courses_data)
        
        # Format the courses data as a string
        formatted_courses = ""
        for course in courses_data:
            formatted_courses += f"- {course.get('courseName', 'No Title')}: {course.get('courseDescription', 'No Description')}, URl link: https://hackverse2025.vercel.app/home/{course.get('courseId', 'No Price')}\n"
        
        return formatted_courses
    except Exception as e:
        print(f"Error fetching courses: {e}")
        return "Unable to fetch courses at this time."

def get_mixed_prompt():
    # Fetch courses from API instead of using empty string
    current_cources = get_courses_from_api()
    course_prompt = f"""
    The following are the courses available:
    {current_cources}
    """
    past_stakes = ""
    past_stakes_prompt = f"""
    The following are the past stakes:
    {past_stakes}
    
    Note:
    - If the user asks about the courses, you should provide the URL link to the course. if user ask about course only give the course details dont add anything unwanted.
    - If the user asks about the past stakes, you should provide the past stakes details. if it's not available just say "No past stakes available do you want to stake? i will help you."
    """
    
    return personal_prompt() + course_prompt + past_stakes_prompt
