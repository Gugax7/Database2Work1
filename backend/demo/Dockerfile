FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn -B -ntp dependency:go-offline
COPY src ./src
RUN mvn -B -ntp package -DskipTests

# Development builds only inside the container; no target files are written to the host.
FROM maven:3.9-eclipse-temurin-21 AS development
ARG APP_UID=1000
ARG APP_GID=1000
WORKDIR /app
ENV MAVEN_CONFIG=/cache/maven
COPY pom.xml .
RUN mvn -B -ntp -Dmaven.repo.local=/cache/maven dependency:go-offline
COPY src ./src
COPY scripts/dev.sh /usr/local/bin/mythology-dev
RUN chmod +x /usr/local/bin/mythology-dev && chown -R ${APP_UID}:${APP_GID} /app /cache
USER ${APP_UID}:${APP_GID}
EXPOSE 8080
CMD ["/usr/local/bin/mythology-dev"]

FROM eclipse-temurin:21-jre-alpine AS production
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
USER 10001:10001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
