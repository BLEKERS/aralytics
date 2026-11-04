# Multi-stage build for the Aralytics API.
# Build:  docker build -t aralytics-backend .
# Run:    docker run --rm -p 8080:8080 --env-file .env aralytics-backend

FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace

# Cache dependencies separately from source changes.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre AS runtime

RUN groupadd --system aralytics \
    && useradd --system --gid aralytics --home-dir /app aralytics

WORKDIR /app
COPY --from=build --chown=aralytics:aralytics /workspace/target/backend-*.jar app.jar

USER aralytics
EXPOSE 8080

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
