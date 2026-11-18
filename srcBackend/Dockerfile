FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["FileSharer.Api/FileSharer.Api.csproj", "FileSharer.Api/"]
RUN dotnet restore "FileSharer.Api/FileSharer.Api.csproj"

COPY . .
WORKDIR "/src/FileSharer.Api"
RUN dotnet publish "FileSharer.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV FileStorage__StoragePath=/app/SharedFiles

RUN mkdir -p /app/SharedFiles

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "FileSharer.Api.dll"]
